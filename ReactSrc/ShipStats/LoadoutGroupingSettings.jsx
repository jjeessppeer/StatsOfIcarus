

export class LoadoutGroupingSettings extends React.Component {
  render() {
    return (
      <div className="loadout-grouping-settings">
        <GunToggle></GunToggle>
        <GunToggle></GunToggle>
        <GunToggle></GunToggle>
        <GunToggle></GunToggle>
        <GunToggle></GunToggle>
      </div>
    )
  }
}


class IgnoredGunsBar extends React.Component {

}

class GunToggle extends React.Component {
  render() {
    return (
      <button>1</button>
    )
  }
}