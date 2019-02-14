import React, { Component } from 'react';
import STLViewer from '../../src/STLViewer';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      color: '#FF0000',
      model: undefined
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

  render() {
    return (
      <div>
        <input id="image-file" type="file" onChange={this.onChange} />
        <STLViewer
          // url="dist/static/crazy-things.stl"
          url="https://cdn2.myminifactory.com/asets/object-assets/579fd4de8bd7d/threedfiles/ring-poly-2-1.stl"
          model={this.state.model}
          modelColor={this.state.color}
          lights={[[0.5, 1, -1], [1, 1, 1]]}
          showGrid={true}
          rotate={false}
          onUpdate={this.onUpdate}
        />
        <button onClick={this.clickRed}>red</button>
        <button onClick={this.clickBlue}>blue</button>
      </div>
    );
  }
}
export default App;
