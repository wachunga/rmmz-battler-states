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
 * To use, simply add one of the following to the Note box of a state:
 * <battler:color r,g,b,gray> (where each is 0 to 255)
 * <battler:white>
 * <battler:black>
 * <battler:red>
 * <battler:green>
 * <battler:blue>
 * <battler:outline-white>
 * <battler:outline-black>
 * <battler:outline-red>
 * <battler:outline-green>
 * <battler:outline-blue>
 * <battler:translucent>
 * <battler:blur>
 * <battler:grain>
 * <battler:invert>
 * <battler:shrink>
 * <battler:grow>
 * <battler:size x> (where x is a decimal number, 1 being default)
 *
 * Heads up: the "[SV] Overlay" of a state (if used) will also be affected.
 * For example, it will change color tone based on the state.
 */

(() => {
  Sprite.prototype.resetEffects = function () {
    this.setColorTone([0, 0, 0, 0]);
    this.setBlendColor([0, 0, 0, 0]);
    this.blendMode = 0;
    this.opacity = 255;
    this.filters = [];
    this.scale.x = 1;
    this.scale.y = 1;
  };

  Sprite.prototype._createBlurFilter = function () {
    const filter = new PIXI.filters.BlurFilter(6);
    if (!this.filters) {
      this.filters = [];
    }
    this.filters.push(filter);
  };
  Sprite.prototype._createNoiseFilter = function () {
    const filter = new PIXI.filters.NoiseFilter(0.5);
    if (!this.filters) {
      this.filters = [];
    }
    this.filters.push(filter);
  };
  Sprite.prototype._createNegativeFilter = function () {
    const filter = new PIXI.filters.ColorMatrixFilter();
    filter.negative(true);
    if (!this.filters) {
      this.filters = [];
    }
    this.filters.push(filter);
  };
  Sprite.prototype._createOutlineFilter = function (color = 0xff0000) {
    const filter = new OutlineFilter();
    filter.color = color;
    filter.thickness = 3;
    filter.alpha = 0.8;
    if (!this.filters) {
      this.filters = [];
    }
    this.filters.push(filter);
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
      .filter((state) => state.meta.battler);
    statesWithEffects.forEach((state) => {
      // TODO: handle multiple effects by parsing state.note.split('\n') etc
      const effect = state.meta.battler;
      const [id, ...params] = effect.split(/\s|,/).filter(Boolean);
      // console.debug({ id, params });
      switch (id) {
        case "color":
          if (params.length != 4) {
            onError(
              `failed to parse color notetag — expected format is: red,green,blue,gray`
            );
          }
          // const [r, g, b, gray] = params;
          this.setColorTone(params);
          break;
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
        case "outline-white":
          this._createOutlineFilter(0xffffff);
          break;
        case "outline-black":
          this._createOutlineFilter(0x000000);
          break;
        case "outline-red":
          this._createOutlineFilter(0xff0000);
          break;
        case "outline-green":
          this._createOutlineFilter(0x00ff00);
          break;
        case "outline-blue":
          this._createOutlineFilter(0x0000ff);
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
        case "invert":
          this._createNegativeFilter();
          break;
        case "shrink":
          this.scale.x = 0.5;
          this.scale.y = 0.5;
          break;
        case "grow":
          this.scale.x = 1.5;
          this.scale.y = 1.5;
          break;
        case "size":
          const scaleParam = parseFloat(params[0]);
          if (isNaN(scaleParam)) {
            onError(`failed to parse size notetag ${effect}`);
          }
          this.scale.x = scaleParam;
          this.scale.y = scaleParam;
          break;
      }
    });
  };

  function onError(message) {
    throw new Error(`[BattlerStates plugin] ${message}`);
  }

  const _Game_BattlerBase_addNewState = Game_BattlerBase.prototype.addNewState;
  Game_BattlerBase.prototype.addNewState = function (stateId) {
    _Game_BattlerBase_addNewState.call(this, stateId);

    // set a flag if the new state has an effect
    const hasEffect = Boolean($dataStates[stateId].meta.battler);
    if (hasEffect) {
      this._needsEffectsInit = true;
    }
  };

  const _Game_Actor_eraseState = Game_Actor.prototype.eraseState;
  Game_Actor.prototype.eraseState = function (stateId) {
    _Game_Actor_eraseState.call(this, stateId);

    // set a flag if the removed state had an effect and needs cleaned up
    const hasEffect = Boolean($dataStates[stateId].meta.battler);
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

  // OutlineFilter code is MIT licensed from https://www.npmjs.com/package/@pixi/filter-outline

  var outlineVertex = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    vTextureCoord = aTextureCoord;
}`,
    outlineFragment = `varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec4 filterClamp;

uniform float uAlpha;
uniform vec2 uThickness;
uniform vec4 uColor;
uniform bool uKnockout;

const float DOUBLE_PI = 2. * 3.14159265358979323846264;
const float ANGLE_STEP = \${angleStep};

float outlineMaxAlphaAtPos(vec2 pos) {
    if (uThickness.x == 0. || uThickness.y == 0.) {
        return 0.;
    }

    vec4 displacedColor;
    vec2 displacedPos;
    float maxAlpha = 0.;

    for (float angle = 0.; angle <= DOUBLE_PI; angle += ANGLE_STEP) {
        displacedPos.x = vTextureCoord.x + uThickness.x * cos(angle);
        displacedPos.y = vTextureCoord.y + uThickness.y * sin(angle);
        displacedColor = texture2D(uSampler, clamp(displacedPos, filterClamp.xy, filterClamp.zw));
        maxAlpha = max(maxAlpha, displacedColor.a);
    }

    return maxAlpha;
}

void main(void) {
    vec4 sourceColor = texture2D(uSampler, vTextureCoord);
    vec4 contentColor = sourceColor * float(!uKnockout);
    float outlineAlpha = uAlpha * outlineMaxAlphaAtPos(vTextureCoord.xy) * (1.-sourceColor.a);
    vec4 outlineColor = vec4(vec3(uColor) * outlineAlpha, outlineAlpha);
    gl_FragColor = contentColor + outlineColor;
}
`;
  const OutlineFilter = class extends PIXI.Filter {
    constructor(
      thickness = 1,
      color = 0,
      quality = 0.1,
      alpha = 1,
      knockout = !1
    ) {
      super(
        outlineVertex,
        outlineFragment.replace(
          /\$\{angleStep\}/,
          OutlineFilter.getAngleStep(quality)
        )
      ),
        (this._thickness = 1),
        (this._alpha = 1),
        (this._knockout = !1),
        (this.uniforms.uThickness = new Float32Array([0, 0])),
        (this.uniforms.uColor = new Float32Array([0, 0, 0, 1])),
        (this.uniforms.uAlpha = alpha),
        (this.uniforms.uKnockout = knockout),
        Object.assign(this, {
          thickness: thickness,
          color: color,
          quality: quality,
          alpha: alpha,
          knockout: knockout,
        });
    }
    static getAngleStep(o) {
      const t = Math.max(
        o * OutlineFilter.MAX_SAMPLES,
        OutlineFilter.MIN_SAMPLES
      );
      return ((Math.PI * 2) / t).toFixed(7);
    }
    apply(o, t, n, e) {
      (this.uniforms.uThickness[0] = this._thickness / t._frame.width),
        (this.uniforms.uThickness[1] = this._thickness / t._frame.height),
        (this.uniforms.uAlpha = this._alpha),
        (this.uniforms.uKnockout = this._knockout),
        o.applyFilter(this, t, n, e);
    }
    get alpha() {
      return this._alpha;
    }
    set alpha(o) {
      this._alpha = o;
    }
    get color() {
      return PIXI.utils.rgb2hex(this.uniforms.uColor);
    }
    set color(o) {
      PIXI.utils.hex2rgb(o, this.uniforms.uColor);
    }
    get knockout() {
      return this._knockout;
    }
    set knockout(o) {
      this._knockout = o;
    }
    get thickness() {
      return this._thickness;
    }
    set thickness(o) {
      (this._thickness = o), (this.padding = o);
    }
  };
  OutlineFilter.MIN_SAMPLES = 1;
  OutlineFilter.MAX_SAMPLES = 100;
})();
