// Direct steering with frame-rate-independent response and strong release braking.
export function steerVelocity(velocity, direction, speed, dt) {
  const moving = Math.hypot(direction.x, direction.y) > 0;
  const blend = 1 - Math.exp(-(moving ? 16 : 22) * dt);
  return {
    x: velocity.x + (direction.x * speed - velocity.x) * blend,
    y: velocity.y + (direction.y * speed - velocity.y) * blend,
  };
}
