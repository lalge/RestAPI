import React from "react";
import DataPoint from "../../models/datapointsModel";
import DataPointsEntry from "./datapointsEntry";
// Compontents class since we need internal State
class DataPointsEntryUncontrolled extends React.Component {
    constructor() {
        super();
        // this.state =
        //     {
        //         dataPoint: new DataPoint()
        //     };
        this.dataPointKeyRef = React.createRef()
        this.dataPointValueRef = React.createRef()

        this.formRef = React.createRef()

        // bind function
        this.handelSave = this.handelSave.bind(this);
        this.resetForm = this.resetForm.bind(this);
        
    }
    resetForm()
    {
        this.formRef.current.reset();
    }
    //
    handelSave() {
        var dataPoint = new DataPoint();
        dataPoint.key = this.dataPointKeyRef.current.value;
        dataPoint.value = this.dataPointValueRef.current.value;
        console.log("in handelSave");
        console.log(dataPoint);

        // Pass to Parent
        this.props.onAdd(
            {
                data:dataPoint,
                onDataAdd:this.resetForm
            }
            );
    }
    // render class component
    render() {
        const keyRow =
            (
                <section>
                    <span>Key</span>
                    <input
                        type="text"
                        name="key"
                        ref={this.dataPointKeyRef}

                    ></input>
                </section>
            );
        const valueRow =
            (
                <section>
                    <span>valueRow</span>
                    <input
                        type="text"
                        name="value"
                        ref={this.dataPointValueRef}

                    ></input>
                </section>
            );

        return (
            <form ref={this.formRef}>
                {keyRow}
                {valueRow}
                <button type="button" onClick={this.handelSave}>
                    Save
                </button>
            </form>
        );
    }

}

// set default properties if not set, usefull to de-cuppled the child componente from parent
DataPointsEntryUncontrolled.defaultProps =
    {
        onAdd: () => { } // noop
    }
export default DataPointsEntryUncontrolled; //default export