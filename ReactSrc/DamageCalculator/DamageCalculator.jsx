
export class DamageCalculator extends React.PureComponent {
  static defaultProps = {
  }

  constructor(props) {
    super(props);

    this.state = {
      selectedGun: this.props.gunItems[0],
      selectedAmmo: undefined,
      buffEnabled: false,
      directEnabled: true,
      aoeEnabled: true,
      laserRange: 800,
      laserTime: 10
    }
  }

  ammoChanged = (evt) => {
    const ammoItem = this.props.ammoItems.find(el => el.Name == evt.target.value);
    this.setState({
      selectedAmmo: ammoItem
    });
  }

  gunChanged = (evt) => {
    const gunItem = this.props.gunItems.find(el => el.Name == evt.target.value);
    this.setState({
      selectedGun: gunItem
    });
  }

  buffChanged = (evt) => {
    this.setState({buffEnabled: evt.target.checked});
  }

  directChanged = (evt) => {
    this.setState({directEnabled: evt.target.checked});
  }

  aoeChanged = (evt) => {
    this.setState({aoeEnabled: evt.target.checked});
  }

  laserRangeChanged = (evt) => {
    this.setState({laserRange: evt.target.value});
  }

  laserTimeChanged = (evt) => {
    this.setState({laserTime: evt.target.value});
  }

  render() {
    const gunOptions = [];
    for (const gunItem of this.props.gunItems) {
      if (this.state.pveEnabled || gunItem.GameType & 1) {
        gunOptions.push(<option selected={this.state.selectedGun === gunItem}>{gunItem.Name}</option>);
      }
    }

    const ammoOptions = [];
    for (const ammoItem of this.props.ammoItems) {
      ammoOptions.push(<option selected={this.state.selectedAmmo === ammoItem}>{ammoItem.Name}</option>);
    }

    // Calculate the table data.
    const gunItem = this.state.selectedGun;
    let ammoItem = this.state.selectedAmmo;
    const defaultAmmo = {
      Effects: {}
    }
    if (ammoItem == undefined) ammoItem = defaultAmmo;

    const cooldownTime = gunItem.CooldownTime / getAmmoEffect("ModifyRateOfFire", ammoItem);
    const warmupTime = getGunParam('fChargeUpTime', gunItem, 0);
    const reloadTime = gunItem.ReloadTime / (this.state.buffEnabled ? 1.1 : 1);
    const clipSize = Math.max(1, Math.round(gunItem.MaxAmmunition * getAmmoEffect("ModifyAmmoCount", ammoItem)));
    const secondsPerClip = Math.max((clipSize - 1) * cooldownTime, 1) + warmupTime;
    const secondsPerCycle = secondsPerClip + reloadTime;

    const range = gunItem.Range * getAmmoEffect("ModifyProjectileSpeed", ammoItem) * getAmmoEffect("ModifyLifetime", ammoItem);
    const muzzleSpeed = getGunParam("fMuzzleSpeed", gunItem, 1) * getAmmoEffect("ModifyProjectileSpeed", ammoItem);
    const armingDelay = getGunParam("fArmingDelay", gunItem, 0) * getAmmoEffect("ModifyArmingTime", ammoItem);
    const armingDistance = muzzleSpeed * armingDelay;
    const aoe = getGunParam("fShellBurstSize", gunItem, 0) * getAmmoEffect("ModifyAreaOfEffect", ammoItem);

    // Calculate damage per shot.
    const damages = {}
    const ammoDamageMod = getAmmoEffect("ModifyDamage", ammoItem);
    const ammoDirectMod = getAmmoEffect("ModifyPrimaryDamage", ammoItem);
    const ammoBurstMod = getAmmoEffect("ModifySecondaryDamage", ammoItem);
    const laserModifier = laserDistanceModifier(gunItem, ammoItem, this.state.laserRange) * laserTimeModifier(gunItem, ammoItem, secondsPerClip);
    const buffMod = (this.state.buffEnabled ? 1.1 : 1);
    const shots = getGunParam("iRaysPerShot", gunItem, 1);
    for (const componentType in DAMAGE_MODIFIERS[gunItem.Damage.DirectHit.Type]) {
      damages[componentType] = {};
      const modifier = DAMAGE_MODIFIERS[gunItem.Damage.DirectHit.Type][componentType];
      damages[componentType].direct = gunItem.Damage.DirectHit.Amount * modifier * ammoDamageMod * ammoDirectMod * buffMod * laserModifier * shots;
      damages[componentType].direct *= this.state.directEnabled ? 1 : 0;
    }
    for (const componentType in DAMAGE_MODIFIERS[gunItem.Damage.BurstHit.Type]) {
      const modifier = DAMAGE_MODIFIERS[gunItem.Damage.BurstHit.Type][componentType];
      damages[componentType].burst = gunItem.Damage.BurstHit.Amount * modifier * ammoDamageMod * ammoBurstMod * buffMod * laserModifier * shots;
      damages[componentType].burst *= this.state.aoeEnabled ? 1 : 0;
    }
    for (const componentType in DAMAGE_MODIFIERS[gunItem.Damage.BurstHit.Type]) {
      damages[componentType].total = damages[componentType].burst + damages[componentType].direct;
    }

    // Damage scaling for the table rows.
    const perClipScale = clipSize;
    const perSecondScale = clipSize / secondsPerClip;
    const perCycleScale = clipSize / secondsPerCycle;
    // const laserTimeScale = perSecondScale * this.state.laserTime * laserTimeModifier(gunItem, ammoItem, this.state.laserTime);

    return (
      <div className={"damage-calculator"}>
        <h2>Damage calculator</h2>
        <div className="input-group">
          <div className="input-group-prepend small">
            <div className="input-group-text">Gun</div>
          </div>
          <select className="form-control" onChange={this.gunChanged}>
            {gunOptions}
          </select>
        </div>
        <div className="input-group">
          <div className="input-group-prepend small">
            <div className="input-group-text">Ammo</div>
          </div>
          <select className="form-control" onChange={this.ammoChanged}>
            <option selected={this.state.selectedAmmo == undefined}>Normal</option>
            {ammoOptions}
          </select>
        </div>
        <label>
          <input type="checkbox" onChange={this.buffChanged} checked={this.state.buffEnabled}/>
          Buffed
        </label>
        <label>
          <input type="checkbox" onChange={this.directChanged} checked={this.state.directEnabled}/>
          Direct damage
        </label>
        <label>
          <input type="checkbox" onChange={this.aoeChanged} checked={this.state.aoeEnabled}/>
          AoE damage
        </label>
        {gunItem.Name == "Aten Lens Array [Mk. S]" && 
        <LaserInput
          maxTime={secondsPerClip}
          maxRange={range}
          laserRange={this.state.laserRange}
          laserTime={this.state.laserTime}
          rangeChanged={this.laserRangeChanged} 
          timeChanged={this.laserTimeChanged} />}
        
        <GunTable
          range={range}
          armingDistance={armingDistance}
          secondsPerClip={secondsPerClip}
          reloadTime={reloadTime}
          clipSize={clipSize}
          aoe={aoe}
        />
        <DamageTable
          damages={damages}
          perClipScale={perClipScale}
          perSecondScale={perSecondScale}
          perCycleScale={perCycleScale}
        />
      </div>
    );
  }
}

class LaserInput extends React.PureComponent {
  render() {
    return (
      <div className="laser-input">
        <div className="input-group">
          <div className="input-group-prepend">
            <div className="input-group-text">
              Distance
            </div>
          </div>
          <input className="form-control number-box" type="text" disabled={true} value={`${this.props.laserRange}m`}></input>
          <input className="laser-range" type="range" onChange={this.props.rangeChanged}
            value={this.props.laserRange}
            max={this.props.maxRange}></input>
        </div>
        {/* <div className="input-group">
          <div className="input-group-prepend">
            <div className="input-group-text">
              Time
            </div>
          </div>
          <input className="form-control number-box" type="text" disabled={true} value={`${this.props.laserTime}s`}></input>
          <input className="laser-range" type="range" onChange={this.props.timeChanged} 
            value={this.props.laserTime}
            max={this.props.maxTime} 
            step={0.1}></input>
        </div> */}
      </div>
    )
  }
}

class GunTable extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <table className="gun-table fixed table table-bordered">
        <tr>
          <th>Range (m)</th>
          <th>Arming distance (m)</th>
          <th>Seconds / clip (s)</th>
          <th>Reload time (s)</th>
          <th>Clip size</th>
          <th>AOE (m)</th>
        </tr>
        <tbody>
          <tr>
            <td>{this.props.range.toFixed(0)}</td>
            <td>{this.props.armingDistance.toFixed(0)}</td>
            <td>{this.props.secondsPerClip.toFixed(1)}</td>
            <td>{this.props.reloadTime.toFixed(1)}</td>
            <td>{this.props.clipSize.toFixed(0)}</td>
            <td>{this.props.aoe.toFixed(1)}</td>
          </tr>
        </tbody>
      </table>
    )
  }
}

class DamageTable extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <table class="damage-table fixed table table-bordered">
        <tr>
          <th class="medium">Damage (primary + secondary)</th>
          <th class="medium">Armor</th>
          <th class="medium">Hull</th>
          <th class="medium">Balloon</th>
          <th class="medium">Component</th>
        </tr>
        <tbody>
          <DamageRow title="Damage / shot" damages={this.props.damages} scale={1} showDamageSplit={true} />
          <DamageRow title="Damage / clip" damages={this.props.damages} scale={this.props.perClipScale} />
          <DamageRow title="Damage / second (one clip)" damages={this.props.damages} scale={this.props.perSecondScale} />
          <DamageRow title="Damage / second (with reloading)" damages={this.props.damages} scale={this.props.perCycleScale} />
        </tbody>
      </table>
    );
  }
}

class DamageRow extends React.PureComponent {
  render() {
    return (
      <tr>
        <th>{this.props.title}</th>
        <DamageCell damage={this.props.damages["Armor"]} scale={this.props.scale} showDamageSplit={this.props.showDamageSplit} />
        <DamageCell damage={this.props.damages["Hull"]} scale={this.props.scale} showDamageSplit={this.props.showDamageSplit} />
        <DamageCell damage={this.props.damages["Balloon"]} scale={this.props.scale} showDamageSplit={this.props.showDamageSplit} />
        <DamageCell damage={this.props.damages["Components"]} scale={this.props.scale} showDamageSplit={this.props.showDamageSplit} />
      </tr>
    )
  }
}

class DamageCell extends React.PureComponent {
  render() {
    const total = (this.props.damage.total * this.props.scale).toFixed(0);
    const direct = (this.props.damage.direct * this.props.scale).toFixed(0);
    const burst = (this.props.damage.burst * this.props.scale).toFixed(0);
    return (
      <td className="damage-cell">
        {total}
        {this.props.showDamageSplit &&
          <span>{`(${direct}/${burst})`}</span>}
      </td>
    )
  }
}

const DAMAGE_MODIFIERS = {
  "FIRE": {
    Balloon: 1.5,
    Hull: 1.3,
    Armor: 0.8,
    Components: 0.25
  },
  "HOOK": {
    Balloon: 1.8,
    Hull: 0.2,
    Armor: 0.25,
    Components: 0
  },
  "LIGHTNING": {
    Balloon: 0.2,
    Hull: 0.1,
    Armor: 0.2,
    Components: 2
  },
  "PIERCING": {
    Balloon: 0.2,
    Hull: 0.2,
    Armor: 1.5,
    Components: 0.2
  },
  "EXPLOSIVE": {
    Balloon: 0.25,
    Hull: 1.4,
    Armor: 0.3,
    Components: 0.3
  },
  "IMPACT": {
    Balloon: 1.8,
    Hull: 1.5,
    Armor: 0.8,
    Components: 0.6
  }
}

function laserDistanceModifier(gunItem, ammoItem, distance) {
  if (gunItem.Name != "Aten Lens Array [Mk. S]") return 1.0;
  // Distance damage falloff.
  // Damage falls per second out of ideal range
  const muzzleSpeed = getGunParam("fMuzzleSpeed", gunItem, 1) * getAmmoEffect("ModifyProjectileSpeed", ammoItem);
  const falloffStartTime = getGunParam('fDamageFalloffStart', gunItem);
  const falloffStartDistance = falloffStartTime * muzzleSpeed;
  const falloffRate = getGunParam('fDamageFalloff', gunItem);
  const falloffPerMeter = falloffRate / muzzleSpeed;

  const overIdealRange = Math.max(0, distance - falloffStartDistance);
  const distanceModifier = 1 - falloffPerMeter * overIdealRange;

  return distanceModifier;
}

function laserTimeModifier(gunItem, ammoItem, time) {
  if (gunItem.Name != "Aten Lens Array [Mk. S]") return 1.0;
  // Chargeup damage
  // Damage ramps per second continuously fired
  const warmupTime = getGunParam('fChargeUpTime', gunItem);
  const chargeupSpeed = getGunParam('fDamageAcceleration', gunItem);
  const chargeupMax = getGunParam('fMaxDamageModifier', gunItem);

  const timeToMaxCharge = chargeupMax / chargeupSpeed;
  const rampingTime = Math.min(time - warmupTime, timeToMaxCharge);
  const stableTime = Math.max(0, time - rampingTime - warmupTime);

  const stableDamage =  stableTime * chargeupMax;
  const rampingDamage = rampingTime * rampingTime * chargeupSpeed / 2;

  const chargeupModifier = (stableDamage + rampingDamage) / time;

  return chargeupModifier;
}

export function getAmmoEffect(effect, ammoItem) {
  try{
    return 1 + (ammoItem.Effects[effect] ? ammoItem.Effects[effect].Strength : 0);
  }
  catch(e){}
  return 1;
}

export function getGunParam(param, gunItem, defaultValue = 1) {
  try {
    return (gunItem.Params[param] ? Number.parseFloat(gunItem.Params[param]) : defaultValue)
  }
  catch(e){}
  return defaultValue;
}