const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const angleDifference = (target, current) =>
  Math.atan2(Math.sin(target - current), Math.cos(target - current));

// A deliberately simplified low-Reynolds-number swimmer: turn the body first,
// propel along its long axis, damp sideways slip, and follow the ambient flow.
export function swimInFluid({
  heading,
  turnRate = 0,
  velocity,
  direction,
  speed,
  current = { x: 0, y: 0 },
  dt,
  tumbling = false,
  tumbleDirection = 1,
}) {
  const power = Math.min(1, Math.hypot(direction.x, direction.y));
  const moving = power > 0;
  const target = moving ? Math.atan2(direction.y, direction.x) : heading;
  const error = angleDifference(target, heading);
  const targetTurn = tumbling ? tumbleDirection * 7 : moving ? clamp(error * 5, -3.2, 3.2) : 0;
  turnRate += (targetTurn - turnRate) * (1 - Math.exp(-18 * dt));
  let turn = turnRate * dt;
  if (!tumbling && moving && Math.abs(turn) > Math.abs(error)) {
    turn = error;
    turnRate = 0;
  }
  heading += turn;
  const alignment = moving ? Math.max(0, Math.cos(angleDifference(target, heading))) : 0;
  const thrust = tumbling ? 0 : speed * power * alignment;
  const cos = Math.cos(heading),
    sin = Math.sin(heading);
  const vx = velocity.x - current.x,
    vy = velocity.y - current.y;
  const forward = vx * cos + vy * sin;
  const lateral = -vx * sin + vy * cos;
  const nextForward = forward + (thrust - forward) * (1 - Math.exp(-14 * dt));
  const nextLateral = lateral * Math.exp(-24 * dt);
  return {
    heading,
    turnRate,
    velocity: {
      x: cos * nextForward - sin * nextLateral + current.x,
      y: sin * nextForward + cos * nextLateral + current.y,
    },
    activity: moving && !tumbling ? power : 0,
  };
}
