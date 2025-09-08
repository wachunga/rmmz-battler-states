//=============================================================================
// RPG Maker MZ - BattlerStates
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Give battlers unique visual effects based on their states.
 * @author wachunga
 *
 * @help BattlerStates.js
 *
 * To use, simply add one of the following to states:
 * <effect:translucent>
 * <effect:blur>
 * <effect:grain>
 * <effect:white>
 * <effect:black>
 * <effect:red>
 * <effect:green>
 * <effect:blue>
 */

(() => {
  Sprite.prototype.resetEffects = function () {
    this.setColorTone([0, 0, 0, 0]);
    this.setBlendColor([0, 0, 0, 0]);
    this.blendMode = 0;
    this.opacity = 255;
    this.filters = [];
  };

  Sprite.prototype._createBlurFilter = function () {
    // this._blurFilter = new PIXI.filters.BlurFilterPass(true,10);
    this._blurFilter = new PIXI.filters.BlurFilter(6);
    if (!this.filters) {
      this.filters = [];
    }
    this.filters.push(this._blurFilter);
  };
  Sprite.prototype._createNoiseFilter = function () {
    this._noiseFilter = new PIXI.filters.NoiseFilter(0.5);
    if (!this.filters) {
      this.filters = [];
    }
    this.filters.push(this._noiseFilter);
  };

  const _Sprite_Actor_update = Sprite_Actor.prototype.update;
  Sprite_Actor.prototype.update = function () {
    _Sprite_Actor_update.call(this);
    if (this._actor) {
      if (this._actor._needsEffectsInit) {
        this.initEffects();
        this._actor._needsEffectsInit = false;
        this._actor._needsEffectsRefresh = false;
      } else if (this._actor._needsEffectsRefresh) {
        this.resetEffects();
        this._actor._needsEffectsRefresh = false;
      }
    }
  };

  Sprite_Actor.prototype.initEffects = function () {
    if (!this._actor) return;

    const statesWithEffects = this._actor
      .states()
      .filter((state) => state.meta.effect);

    statesWithEffects.forEach((state) => {
      const effect = state.meta.effect;
      switch (effect) {
        case "white":
          this.setColorTone([180, 180, 180, 255]);
          break;
        case "black":
          this.setColorTone([-150, -150, -150, 255]);
          break;
        case "red":
          this.setColorTone([180, 0, 0, 255]);
          break;
        case "green":
          this.setColorTone([0, 100, 0, 255]);
          break;
        case "blue":
          this.setColorTone([0, 0, 180, 255]);
          break;
        case "translucent":
          this.opacity = 50;
          break;
        case "blur":
          this._createBlurFilter();
          break;
        case "grain":
          this._createNoiseFilter();
          break;
      }
    });
  };

  const _Game_BattlerBase_addNewState = Game_BattlerBase.prototype.addNewState;
  Game_BattlerBase.prototype.addNewState = function (stateId) {
    _Game_BattlerBase_addNewState.call(this, stateId);

    // set a flag if the new state has an effect
    const hasEffect = Boolean($dataStates[stateId].meta.effect);
    if (hasEffect) {
      this._needsEffectsInit = true;
    }
  };

  const _Game_Actor_eraseState = Game_Actor.prototype.eraseState;
  Game_Actor.prototype.eraseState = function (stateId) {
    _Game_Actor_eraseState.call(this, stateId);

    // set a flag if the removed state had an effect and needs cleaned up
    const hasEffect = Boolean($dataStates[stateId].meta.effect);
    if (hasEffect) {
      this._needsEffectsRefresh = true;
    }
  };

  const _Game_Actor_clearStates = Game_Actor.prototype.clearStates;
  Game_Actor.prototype.clearStates = function () {
    _Game_Actor_clearStates.call(this);

    // on death, states are cleared instead of removed so also set flag
    this._needsEffectsRefresh = true;
  };
})();
