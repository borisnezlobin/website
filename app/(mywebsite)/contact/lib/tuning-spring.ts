const SPRING_RATE = 10;
const REST_DISTANCE = 4e-4;
const REST_SPEED = 4e-3;

export type Spring = { position: number; velocity: number; target: number };

export function stepSpring(spring: Spring, dt: number) {
    const offset = spring.position - spring.target;
    const acceleration = -SPRING_RATE * SPRING_RATE * offset - 2 * SPRING_RATE * spring.velocity;
    spring.velocity += acceleration * dt;
    spring.position += spring.velocity * dt;
    return Math.abs(spring.position - spring.target) < REST_DISTANCE && Math.abs(spring.velocity) < REST_SPEED;
}
