

class Sheet {
    constructor(sheet_id, sheet_page, loaded_callback) {
        // this.href = "https://spreadsheets.google.com/feeds/list/" + sheet_id + "/default/public/values?alt=json";
        this.href = "https://spreadsheets.google.com/feeds/cells/" + sheet_id + "/" + sheet_page + "/public/full?alt=json";
        // https://spreadsheets.google.com/feeds/cells/1Oo1-3ad5_8srmHnc_sUpxgF11kxsapyGs8ogd5cR46g/2/public/full?alt=json
        this.sheet_json = null;
        
        fetch(this.href)
            .then((response) => {
                return response.json();
            })
            .then((myJson) => {
                console.log(myJson);
                this.buildDatabaseArray(myJson);
                this.sheet_json = myJson;
            })
            .then(() => {
                loaded_callback();
            });
    }
    
    buildDatabaseArray(sheet_json){
        let entries = sheet_json.feed.entry;

        let db_arr = [];
        
        let last_y = -1;
        for (let i=0; i < entries.length; i++){
            let coord_text = entries[i].title["$t"];
            let [x, y] = textToXYCoords(coord_text);
            if (y != last_y){
                // Create new row
                last_y = y;
                db_arr.push([]);
            }
            // Push column to current row
            db_arr[last_y].push(entries[i].content["$t"])
            console.log(entries[i].content["$t"]);
        }

        this.titles = db_arr[0];
        db_arr.shift();
        this.content = db_arr;
        console.log(this.titles);
        console.log(this.content);
    }

    getDbRows(){
        return this.content;
    }

    getDbCell(x, y){
        return this.content[x][y];
    }

    getDbRow(x){
        return this.content[x];
    }

    getDbRowsByString(query_string, query_title){
        // Return matching 
        let col_index = this.titles.indexOf(query_title);
        if (col_index == -1)
            return [];
        let result_rows = []
        for(let i=0; i<this.content.length; i++){
            if (this.content[i][col_index].includes(query_string))
                result_rows.push(this.content[i]);
        }
        return result_rows;
    }

};