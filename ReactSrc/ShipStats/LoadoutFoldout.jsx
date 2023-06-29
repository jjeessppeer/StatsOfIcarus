import { ShipCanvas } from '/React/ShipCanvas.js';
import { loadoutStringToCanvasData, eloWinrate } from '/React/ShipStats/LoadoutUtils.js';

export class LoadoutInfoFoldout extends React.Component {
    render() {
        const matchupComponents = [];
        for (const s of this.props.matchupStats) {
            matchupComponents.push(<LoadoutMatchup {...s}></LoadoutMatchup>);
            // console.log(s);
        }

        // Fetch matchups
        // merge according to settings
        return (
            <div className="loadout-matchup-foldout info-card">
                {matchupComponents}
                {/* <LoadoutMatchup></LoadoutMatchup> */}
                {/* <LoadoutMatchup></LoadoutMatchup> */}
            </div>
        )
    }
}


class LoadoutMatchup extends React.Component {
    
    render() {
        function toPercentage(n, tot) {
            return Math.round(100 * n / tot);
        }
        console.log("RENDERING MATCHUPTHING")
        const p = { shipModel: 16, shipLoadout: [] }
        const canvasData = loadoutStringToCanvasData(this.props._id);
        return (
            <div className="loadout-matchup-box">
                <ShipCanvas {...canvasData} width="100"></ShipCanvas>
                <div>
                    <div>Matchup played: {this.props.PlayedVs}</div>
                    <div>Win rate: {Math.round(100 * this.props.WinsVs / this.props.PlayedVs)}%</div>
                    <div>Elo adjusted: {toPercentage(eloWinrate(this.props.ExpectedOutcomeVs, this.props.ActualOutcomeVs, this.props.PlayedVs), 1)}%</div>
                </div>
            </div>
        )
    }
}