export class PlayerPerspective extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      loading: true
    }
  }

  render() {
    if (this.state.loading) {
      return (<div>Loading...</div>);
    }
  }
}