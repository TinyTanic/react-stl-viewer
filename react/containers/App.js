import React, { Component } from 'react';
import STLViewer from '../../src/STLViewer';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      color: '#FF0000',
      model: undefined,
      scale: 1
    };

    this.clickBlue = this.clickBlue.bind(this);
    this.clickRed = this.clickRed.bind(this);
  }

  clickBlue(e) {
    e.preventDefault();
    this.setState({ color: '#0000FF' });
  }

  clickRed(e) {
    e.preventDefault();
    this.setState({ color: '#FF0000' });
  }

  onChange = ({ target }) => {
    const { files } = target;
    const reader = new FileReader();
    reader.readAsArrayBuffer(files[0]);
    reader.onload = () => {
      this.setState({ model: reader.result });
    };
  };

  onUpdate = update => {
    console.log(update);
  };

  onChangeScale = ({ target }) => {
    this.setState({ scale: parseFloat(target.value) });
  };

  render() {
    return (
      <div>
        <input id="image-file" type="file" onChange={this.onChange} />
        <STLViewer
          model={this.state.model}
          modelColor={this.state.color}
          lights={[[0.5, 1, -1], [1, 1, 1]]}
          rotate={false}
          onUpdate={this.onUpdate}
          scale={this.state.scale}
          gridDimension={100}
        />
        <button onClick={this.clickRed}>red</button>
        <button onClick={this.clickBlue}>blue</button>
        <input
          type="number"
          placeholder="scale"
          step=".1"
          min="0"
          value={this.state.scale}
          onChange={this.onChangeScale}
        />
      </div>
    );
  }
}
export default App;
