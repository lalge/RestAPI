
import React from "react";
import DataPoint from "../../models/datapointsModel";

// Component Class since we need internal State
//DataPointsEntry.prototype = handleChange
class DataPointsEntry extends React.Component
{
    constructor()
    {
        super();
        this.formRef = React.createRef();
        this.dataPointKeyRef = React.createRef();
        this.dataPointValueRef = React.createRef();
        this.handleSave = this.handleSave.bind(this);
        this.resetForm = this.resetForm.bind(this);
    }

    resetForm()
    {
        this.formRef.current.reset();
    }

    handleSave()
    {
        var dataPoint = new DataPoint();
        dataPoint.key =  this.dataPointKeyRef.current.value;
        dataPoint.value =  this.dataPointValueRef.current.value;

        //Pass to Parent
        this.props.onAdd(
            {
                data : dataPoint,
                onDataAdd : this.resetForm
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
                    ref={this.dataPointKeyRef} />
            </section>
        );

        const valueRow = 
        (
            <section>
                <span>Value</span>
                <input 
                    type="text" 
                    name="value"
                    ref={this.dataPointValueRef}/>
            </section>
        );

        return(
            <>
                <h2>
                    DataPoint Entry
                </h2>
                <form ref={this.formRef}>
                   {keyRow}
                   {valueRow}
                   <button type="button" onClick={ this.handleSave }>
                       Save
                   </button>
                </form>
            </>
        );
    }
}

DataPointsEntry.defaultProps = 
{
    onAdd : () => {} // noop
}

export default DataPointsEntry;