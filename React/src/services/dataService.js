


const datapointRestEndpoint = "http://localhost:90/datapoints";

var datapoints = [];

function errorHandler(reject,error)
{
    console.dir(error);
    reject("operation failed");
}

function getDataPointsStubData()
{
  return new Promise(
      async function onThen(resolve,reject)
      {
        try
        {
            // XHR HERE
            var response = await window.fetch(datapointRestEndpoint);
            datapoints = await response.json();
            resolve(datapoints);
        }
        catch(ex)
        {
            errorHandler(reject,ex)
        }
      }
  );
}

function saveDataPointToStudData(dataPoint)
{
    // console.group("saveDataPointToStudData");
    // console.dir(dataPoint);
    // console.groupEnd();

    return new Promise(
        async function onThen(resolve,reject)
        {
          try
          {
                var response = await window.fetch(
                    datapointRestEndpoint,
                    {
                        method : "POST",
                        body : dataPoint.serialize(),
                        headers :
                        {
                            "Content-Type" : "application/json"
                        }
                    });

                var data = await response.json();
                //datapoints.push(data);
                resolve(data);
          }
          catch(ex)
          {
            errorHandler(reject,ex)
          }
        }
    )
}

const dataService = 
{
    // Revealing Module Pattern
    getDataPoints : getDataPointsStubData,
    saveDataPoint : saveDataPointToStudData
};

export default dataService