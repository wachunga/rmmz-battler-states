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
 * <effect:whiten>
 * <effect:translucent>
 *
 * (May add more in the future)
 */

(() => {
  Sprite.prototype.resetEffects = function () {
    this.setColorTone([0, 0, 0, 0]);
    this.setBlendColor([0, 0, 0, 0]);
    this.blendMode = 0;
    this.opacity = 255;
  };

  const _Sprite_Actor_update = Sprite_Actor.prototype.update;
  Sprite_Actor.prototype.update = function () {
    _Sprite_Actor_update.call(this);
    if (this._actor) {
      if (this._actor._needsEffectsInit) {
        this.initEffects();
        this._actor._needsEffectsInit = false;
      }
      if (this._actor._needsEffectsRefresh) {
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
      if (effect === "whiten") {
        this.setColorTone([180, 180, 180, 255]);
      } else if (effect === "translucent") {
        this.setColorTone([180, 180, 180, 255]);
        this.opacity = 120;
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
