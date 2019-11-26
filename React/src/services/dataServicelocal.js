import DataPoint from "../models/datapointsModel";

var stubData= [
        new DataPoint(Math.random(),"key1","Value1"),
        new DataPoint(Math.random(),"key2","Value2"),
        new DataPoint(Math.random(),"key3","Value3"),
    ];;
function getDataPointsStubData()
{
    return stubData;
}

function saveDataPointToStubData(dataPoint)
{
    stubData.push(dataPoint);
}


const dataServiceLocal=
{
    // Revaling Module Pattern
    getDataPoints : getDataPointsStubData,
    saveDataPoints: saveDataPointToStubData
};

export default dataServiceLocal;
 