import BootScene from "./src/boot-scene.mjs";
import GameScene from "./src/game-scene.mjs";

const config = {
  type: Phaser.AUTO,
  backgroundColor: "#07071a",
  width: window.innerWidth,
  height: window.innerHeight,
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [BootScene, GameScene],
  scale: { mode: Phaser.Scale.NONE, autoCenter: Phaser.Scale.NO_CENTER, parent: document.body },
};

const game = new Phaser.Game(config);
// Observe layout as well as window events (orientation and embedded view changes).
const resizeGame = () => {
  if (game.isBooted) game.scale.resize(window.innerWidth, window.innerHeight);
};
const viewportObserver = new ResizeObserver(resizeGame);
viewportObserver.observe(document.documentElement);
game.events.once("ready", resizeGame);
game.events.once("destroy", () => viewportObserver.disconnect());
