import React from "react";
import DataModel from "../../models/datapointsModel";

function DataPointsList(props = { datapoints: [] }) //props.datapoints[]
{
    const tabelHeader =
        (
            <thead>
                <tr>
                    <td>Sr. No.</td>
                    <td>Key</td>
                    <td>Value</td>
                </tr>

            </thead>
        );

    const tableBody =
        (
            <tbody>
                {
                    props.datapoints.map(
                        function predicate(datapoint, index) {
                            return (
                                <tr key={datapoint._id}>
                                    <td>{index + 1}</td>
                                    <td>{datapoint.key}</td>
                                    <td>{datapoint.value}</td>
                                </tr>
                            )
                        }
                    )
                }
            </tbody>

        );

    return (
        <>
            <h2>
                Avaialbe Data Ponts
            </h2>
            <table>
                {tabelHeader}
                {tableBody}
            </table>
        </>

    );
}

export { DataPointsList}; //name export