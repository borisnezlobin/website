/**
 * The text the river carries: invented lines of embedded Rust, firmware C, TypeScript, register
 * names and hex dumps. Nothing here is real code from anywhere; it only has to look plausible
 * as it tumbles past.
 */
export const CODE_LINES = [
    "fn read_encoder(tim: &TIM3) -> i32 {",
    "    let count = tim.cnt.read().bits() as i16;",
    "    count as i32 * TICKS_PER_REV / GEAR_RATIO",
    "}",
    "#[interrupt]",
    "fn EXTI15_10() { LIMIT.store(true, Ordering::SeqCst); }",
    "let pid = Pid::new(kp: 0.42, ki: 0.018, kd: 0.006);",
    "// clamp the arm before it hits the hard stop",
    "if angle > ARM_MAX { motor.set_duty(0); return Err(Fault::Limit); }",
    "impl<SPI: Transfer<u8>> Imu<SPI> {",
    "    pub fn whoami(&mut self) -> Result<u8, SPI::Error> {",
    "        self.read_reg(0x0F)",
    "0x0800_0000  08 20 00 20  c1 01 00 08  4d 02 00 08",
    "0x0800_0010  00 00 00 00  00 00 00 00  ef be ad de",
    "R0=0x2000_1f40 R1=0x0000_0003 R2=0xdead_beef",
    "PC=0x0800_14a2 LR=0x0800_1391 SP=0x2000_7fd8",
    "GPIOA->MODER |= (1 << (5 * 2));",
    "while (!(USART2->SR & USART_SR_TXE)) { }",
    "USART2->DR = byte;",
    "static volatile uint32_t ticks = 0;",
    "void SysTick_Handler(void) { ticks++; }",
    "#define CAN_ID_DRIVE   0x201",
    "can_frame_t f = { .id = CAN_ID_DRIVE, .len = 8 };",
    "memcpy(f.data, &cmd, sizeof cmd);",
    "/* odometry: integrate wheel deltas at 200 Hz */",
    "x += (dl + dr) * 0.5f * cosf(theta);",
    "theta = wrap_pi(theta + (dr - dl) / TRACK_WIDTH);",
    "export function lerp(a: number, b: number, t: number) {",
    "  return a + (b - a) * t;",
    "const path = waypoints.map((p) => toField(p, alliance));",
    "for await (const frame of telemetry.stream()) {",
    "  plot.push(frame.voltage, frame.current);",
    "type Pose = { x: number; y: number; heading: number };",
    "if (Math.abs(error) < TOLERANCE) state = 'settled';",
    "await sleep(20); // 50 Hz control loop",
    "match cmd { Cmd::Intake(p) => roller.set(p), _ => {} }",
    "let mut buf = [0u8; 64];",
    "uart.bwrite_all(b\"AT+BAUD=115200\\r\\n\")?;",
    "defmt::info!(\"battery {=f32} V\", vbat);",
    "TIM2_CCR1 = 1500; // servo centre, us",
    "ADC1->SQR3 = 4; ADC1->CR2 |= ADC_CR2_SWSTART;",
    "0x2000_0100  3f 80 00 00  40 49 0f db  00 00 7a 44",
    "r4 r5 r6 r7 | push {r4-r7, lr}",
    "ldr r0, =0x40021018",
    "str r1, [r0, #0x14]",
    "bkpt #0xab",
    "let heading = imu.gyro_z().integrate(dt).wrap();",
    "debug_assert!(duty <= 1.0, \"duty out of range\");",
    "const kF = 12.0 / FREE_SPEED_RPM;",
    "odom.reset(Pose2d { x: 0.0, y: 0.0, rot: 0.0 });",
    "int16_t raw = (int16_t)(hi << 8 | lo);",
    "float accel_g = raw / 16384.0f;",
    "uint8_t crc8(const uint8_t *p, size_t n);",
    "for (size_t i = 0; i < n; i++) crc = table[crc ^ p[i]];",
    "if (millis() - last > WATCHDOG_MS) fault(FAULT_COMMS);",
    "SCB->AIRCR = 0x05FA0004; // reset",
    "pub const WHEEL_DIAMETER_M: f32 = 0.096;",
    "#[derive(Debug, Clone, Copy, PartialEq)]",
    "pub enum Mode { Disabled, Auto, Teleop, Test }",
    "loop { led.toggle(); delay.delay_ms(250u32); }",
    "const ctx = canvas.getContext('2d');",
    "requestAnimationFrame(tick);",
    "0x0800_2000  ff ff ff ff  ff ff ff ff  ff ff ff ff",
    "MOTOR_L=0.62 MOTOR_R=0.60 ARM=-0.15 CLAW=OPEN",
    "VBAT=12.41 IL=8.2A IR=7.9A T=41C",
    "// TODO: tune feedforward once the new belts arrive",
];

export const STYLE_COMMENT = 0;
export const STYLE_TEXT = 1;
export const STYLE_SYMBOL = 2;
export const STYLE_KEYWORD = 3;
export const STYLE_MAGIC = 4;

const KEYWORDS = new Set([
    "fn", "let", "mut", "pub", "impl", "match", "if", "else", "return", "while", "for", "const", "static", "volatile",
    "void", "int16_t", "uint8_t", "uint32_t", "float", "struct", "enum", "type", "export", "function", "await", "async",
    "loop", "self", "true", "false", "#define", "use", "mod", "size_t", "ldr", "str", "push", "bkpt",
]);

const MAGIC = /^(0x)?(dead_?beef|deadbeef|ef|be|ad|de|0xdead_beef)$/i;

const isWordChar = (c: string) => /[A-Za-z0-9_#]/.test(c);

function styleWord(word: string) {
    if (KEYWORDS.has(word)) return STYLE_KEYWORD;
    if (MAGIC.test(word)) return STYLE_MAGIC;
    return STYLE_TEXT;
}

/** One style per character: comments faint, keywords heavy, punctuation in between, a few magic numbers in red. */
export function styleLine(line: string): Uint8Array {
    const styles = new Uint8Array(line.length);
    const comment = line.search(/\/\/|\/\*/);
    let i = 0;
    while (i < line.length) {
        if (comment >= 0 && i >= comment) { styles[i++] = STYLE_COMMENT; continue; }
        if (!isWordChar(line[i])) { styles[i++] = STYLE_SYMBOL; continue; }
        let end = i;
        while (end < line.length && isWordChar(line[end])) end++;
        styles.fill(styleWord(line.slice(i, end)), i, end);
        i = end;
    }
    return styles;
}
