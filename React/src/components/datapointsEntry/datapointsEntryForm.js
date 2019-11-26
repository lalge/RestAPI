
import React from "react";
import DataPoint from "../../models/datapointsModel";

// Component Class since we need internal State
//DataPointsEntry.prototype = handleChange
class DataPointsEntry extends React.Component
{
    constructor()
    {
        super();
        this.state = 
        {
            dataPoint : new DataPoint()
        }
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event) // sementic event
    {   
        var datapoint = this.state.dataPoint;
        datapoint[event.target.name] =  event.target.value; // Using Index Notation
        
        //React reconcil Virtual DOM with Browser DOM
        this.setState(
            {
                datapoint : datapoint
            },
            function onSetState()
            {
                // Browser DOM has been updated as per Virtual DOM for datapoint
            }
        );
    }

    render()
    {
        const keyRow = 
        (
            <section>
                <span>Key</span>
                <input 
                    type="text" 
                    name="key" 
                    value={this.state.dataPoint.key}
                    onChange={ this.handleChange }/>
            </section>
        );

        const valueRow = 
        (
            <section>
                <span>Value</span>
                <input 
                    type="text" 
                    name="value"
                    value={this.state.dataPoint.value}
                    onChange={ this.handleChange }
                />
            </section>
        );

        return(
            <>
                <h2>
                    DataPoint Entry
                </h2>
                <form>
                   {keyRow}
                   {valueRow}
                </form>
            </>
        );
    }
}

export default DataPointsEntry;