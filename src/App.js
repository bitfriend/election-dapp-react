import React, { PureComponent } from 'react';
import { Button, Select, Space, Table, Typography } from 'antd';
import 'antd/dist/antd.css';
import './App.css';

const { Title } = Typography;
const { Option } = Select;

const columns = [{
  title: '#',
  dataIndex: 'id',
  key: 'id'
},{
  title: 'Name',
  dataIndex: 'name',
  key: 'name'
},{
  title: 'Votes',
  dataIndex: 'votes',
  key: 'votes'
}];

const data = [{
  id: 1,
  name: 'Candidate 1',
  votes: 3
},{
  id: 2,
  name: 'Candidate 1',
  votes: 5
}];

class App extends PureComponent {
  state = {
    activeId: 1
  }

  onChangeCandidate = (value) => this.setState({ activeId: value })

  render = () => (
    <div className="App">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={2}>Election Results</Title>
        <Table columns={columns} dataSource={data} rowKey="id" />
        <Space size="large">
          <Select
            defaultValue={1}
            value={this.state.activeId}
            onChange={this.onChangeCandidate}
            style={{
              width: 200
            }}
          >
            <Option value={1}>Candidate 1</Option>
            <Option value={2}>Candidate 2</Option>
          </Select>
          <Button type="primary" size="large">Vote</Button>
        </Space>
      </Space>
    </div>
  )
}

export default App;
