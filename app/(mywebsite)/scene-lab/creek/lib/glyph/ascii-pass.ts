import type { CreekPalette } from "../palette";
import type { DyePass } from "./dye-pass";
import { drawQuad, fullscreenProgram, type GlLayer } from "./gl-layer";
import type { GlyphRamp } from "./glyph-ramp";

/**
 * The ASCII post-process: the screen is cut into character cells, each cell reads the dye and
 * foam under its centre, turns that into an ink density and picks the character from the glyph
 * ramp with that much ink, after a floor that keeps the faint haze advection leaves as clear water. An 8x8 Bayer threshold breaks ties between neighbouring ramp steps, so
 * smooth gradients come out as an ordered dither of characters. Fast water lifts the density a
 * little and whitewater adds bubbles; the hottest froth, and nothing else, is drawn in red.
 */
const ASCII_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uDye;
uniform sampler2D uFoam;
uniform sampler2D uMask;
uniform sampler2D uVelocity;
uniform sampler2D uRamp;
uniform vec2 uCanvas;
uniform vec2 uCell;
uniform float uGlyphs;
uniform float uInflow;
uniform vec3 uInk;
uniform vec3 uRed;
uniform float uDark;
uniform float uFloor;

float bayer(vec2 cell) {
    ivec2 p = ivec2(mod(cell, 8.0));
    int m[64] = int[64](0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
        3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21);
    return (float(m[p.y * 8 + p.x]) + 0.5) / 64.0;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
    vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uCanvas;
    vec2 cell = floor(px / uCell);
    vec2 inCell = (px - cell * uCell) / uCell;
    vec2 centre = (cell + 0.5) * uCell / uCanvas;
    if (texture(uMask, centre).r > 0.5) discard;
    vec4 dye = texture(uDye, vec2(centre.x, 1.0 - centre.y));
    float foam = texture(uFoam, centre).r;
    float speed = length(texture(uVelocity, centre).rg) / uInflow;
    float raw = dye.r * 0.85 + dye.g * 0.5 + foam * 0.45 + max(0.0, speed - 1.6) * 0.12;
    float density = clamp((raw - uFloor) / (1.0 - uFloor), 0.0, 1.0);
    float level = floor(density * (uGlyphs - 1.0) + bayer(cell));
    if (level < 1.0) discard;
    float ink = texture(uRamp, vec2((min(level, uGlyphs - 1.0) + inCell.x) / uGlyphs, inCell.y)).a;
    bool hottest = foam > 0.9 && hash(cell) > 0.985;
    vec3 colour = hottest ? uRed : uInk;
    float alpha = ink * mix(0.5, 0.95, density) * (hottest ? 1.0 : mix(1.0, 0.92, uDark));
    outColor = vec4(colour * alpha, alpha);
}`;

export type AsciiPass = { render: (dye: DyePass, ramp: GlyphRamp, look: { palette: CreekPalette; dark: boolean }, cell: { w: number; h: number }, inflow: number) => void; dispose: () => void };

/** Dye thinner than this reads as clear water: semi-Lagrangian advection smears a faint haze everywhere. */
const DYE_FLOOR = 0.12;

const rgb = (values: [number, number, number]) => values.map((v) => v / 255) as [number, number, number];

export function createAsciiPass(layer: GlLayer): AsciiPass {
    const { gl } = layer;
    const program = fullscreenProgram(gl, ASCII_FRAGMENT);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    return {
        render: (dye, ramp, look, cell, inflow) => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, layer.canvas.width, layer.canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            [dye.dye(), dye.foam, dye.mask, dye.velocity, ramp.texture].forEach((texture, unit) => {
                gl.activeTexture(gl.TEXTURE0 + unit);
                gl.bindTexture(gl.TEXTURE_2D, texture);
            });
            ["uDye", "uFoam", "uMask", "uVelocity", "uRamp"].forEach((name, unit) => gl.uniform1i(uniform(name), unit));
            const dpr = layer.canvas.width / Math.max(1, layer.canvas.clientWidth);
            gl.uniform2f(uniform("uCanvas"), layer.canvas.width / dpr, layer.canvas.height / dpr);
            gl.uniform2f(uniform("uCell"), cell.w, cell.h);
            gl.uniform1f(uniform("uGlyphs"), ramp.count);
            gl.uniform1f(uniform("uInflow"), inflow);
            gl.uniform3f(uniform("uInk"), ...rgb(look.palette.inkRgb));
            gl.uniform3f(uniform("uRed"), ...rgb(look.palette.redRgb));
            gl.uniform1f(uniform("uDark"), look.dark ? 1 : 0);
            gl.uniform1f(uniform("uFloor"), DYE_FLOOR);
            drawQuad(layer);
        },
        dispose: () => gl.deleteProgram(program),
    };
}
