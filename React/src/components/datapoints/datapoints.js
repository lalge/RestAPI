import React from 'react';
import { DataPointsList } from '../datapointsList/datapointsList';
import DataService from "../../services/dataService";
import DataPointsEntry from '../datapointsEntry/datapointsEntry';
import dataService from '../../services/dataService';
import eventService from '../../services/eventService';

class DataPoints extends React.Component
{
  constructor(props)
  {
    super(props);
    
    this.state = 
    {
      dataPoints : []
    };

    var promise = dataService.getDataPoints();

    promise.then(
      (dataPoints) => 
      {
        this.setState(
          {
            dataPoints : dataPoints
          }
        )
      },
      (errMessage) => { alert(errMessage) }
    );

    const header = this.props.children;
    const headerChildren = header.props.children;
    const elementId = "headerText";
    this.matchedElement = headerChildren.find(
      function predicate(element)
      {
        return element.id == elementId
      }
    )

    this.handleAdd = this.handleAdd.bind(this);
  }

  handleAdd(params)
  {
    var promise = DataService.saveDataPoint(params.data);
    
    promise.then(
      (updatedDataPoints) => 
      {
          this.setState(
          {
            dataPoints : updatedDataPoints
          },
          () => //calling child's callback
          {
            params.onDataAdd();
            eventService.send("Datapoint Added Successfully");
          }
        );
      },
      (errorMessage) => { alert(errorMessage) }
    ) 
  }

  render()
  {
    return(
      <>
        { this.matchedElement }
        <DataPointsList datapoints={ this.state.dataPoints }/>
        <DataPointsEntry onAdd={this.handleAdd}/>
      </>
    );  
  }
}

DataPoints.defaultProps = {};

export default DataPoints;
