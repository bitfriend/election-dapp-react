import React, { PureComponent } from 'react';
import { Alert, Button, Radio, Space, Spin, Table, Typography } from 'antd';
import { cloneDeep } from 'lodash/fp';
import 'antd/dist/antd.css';
import './App.css';

import Web3 from 'web3';
import Election from './contracts/Election.json';
import networks from './truffle-networks';

const { Title } = Typography;

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
  dataIndex: 'voteCount',
  key: 'voteCount'
}];

class App extends PureComponent {
  state = {
    account: '0x0',
    hasVoted: false,
    candidates: [],
    activeId: 0,
    loading: false,
    hasError: false,
    errorMessage: '',
    errorDescription: ''
  }

  async componentDidMount() {
    this.setState({ loading: true });
    try {
      // Get network provider and web3 instance.
      const web3 = await this.getWeb3();
      this.web3 = web3;

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const targetNetId = networks[process.env.REACT_APP_NETWORK_NAME].network_id;
      const networkId = await web3.eth.net.getId();
      if (targetNetId !== '*' && networkId !== targetNetId) {
        const networkType = await web3.eth.net.getNetworkType();
        this.setState({
          loading: false,
          hasError: true,
          errorMessage: 'Error in Ethereum Network Type',
          errorDescription: `Current account is of ${networkType} network. Please select account for ${process.env.REACT_APP_NETWORK_NAME} network.`
        });
        return;
      }
      const deployedNetwork = Election.networks[networkId];
      this.contract = new web3.eth.Contract(Election.abi, deployedNetwork && deployedNetwork.address);

      // Install event watch
      this.watchEvents();

      // Get candidate list
      let candidatesCount = await this.contract.methods.candidatesCount().call();
      candidatesCount = parseInt(candidatesCount, 10);
      const candidates = [];
      for (let i = 1; i <= candidatesCount; i++) {
        const candidate = await this.contract.methods.candidates(i).call();
        candidates.push({
          id: candidate.id,
          name: candidate.name,
          voteCount: parseInt(candidate.voteCount, 10)
        });
      }

      // Check whether you already have voted
      const hasVoted = await this.contract.methods.voters(accounts[0]).call();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({
        loading: false,
        account: accounts[0],
        candidates,
        hasVoted
      });
    } catch (error) {
      this.setState({ loading: false }, () => {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
      });
    }
  }

  getWeb3 = () => new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener('load', () => {
      // Modern dapp browsers...
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          window.ethereum.enable().then(data => {
            // Acccounts now exposed
            resolve(web3);
          });
        } catch (error) {
          reject(error);
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        // Use Mist/MetaMask's provider.
        const web3 = window.web3;
        console.log("Injected web3 detected.");
        resolve(web3);
      }
      // Fallback to localhost; use dev console port by default...
      else {
        const web3 = new Web3(this.getProvider());
        console.log('No web3 instance injected, using Local web3.');
        resolve(web3);
      }
    });
  })

  getProvider() {
    if (process.env.REACT_APP_NETWORK_NAME === 'development') {
      return new Web3.providers.HttpProvider(`http://${networks.development.host}:${networks.development.port}`);
    }
    return networks[process.env.REACT_APP_NETWORK_NAME].provider();
  }

  watchEvents() {
    this.contract.events.votedEvent({
      fromBlock: 0,
      toBlock: 'latest'
    }, (error, event) => {
      console.log('votedEvent', event);
      if (!error) {
        const candidates = cloneDeep(this.state.candidates);
        for (let i = 0; i < candidates.length; i++) {
          if (candidates[i].id === event.returnValues._candidateId) {
            candidates[i].voteCount++;
            break;
          }
        }
        this.setState({ candidates });
      }
    }).on('data', event => {
      console.log('votedEvent data', event);
    }).on('error', console.error);
  }

  onChangeCandidate = (e) => {
    this.setState({ activeId: e.target.value });
  }

  onCastVote = () => {
    this.setState({ loading: true });
    // if gas and gasPrice is insufficient, "vote" method may be failed
    // 20 gwei and 210000 are experienced values, not formally calculated values.
    const gasPrice = this.web3.utils.toWei('20', 'gwei');
    this.contract.methods.vote(this.state.activeId).send({
      gas: 210000,
      gasPrice,
      from: this.state.account
    }).on('transactionHash', (hash) => {
      console.log('Hash');
    }).on('receipt', (receipt) => {
      console.log('Receipt');
    }).on('confirmation', (confirmationNumber, receipt) => {
      console.log('Confirmed');
    }).on('error', console.error).then(result => {
      this.setState({
        loading: false,
        hasVoted: true
      });
    }).catch(error => {
      this.setState({ loading: false });
      console.log(error);
    });
  }

  render = () => (
    <div className="App">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {this.state.hasError && (
          <Alert
            type="warning"
            message={this.state.errorMessage}
            description={this.state.errorDescription}
            closable
            onClose={() => this.setState({ hasError: false })}
          />
        )}
        <Title level={3}>Election Results</Title>
        <Title level={5}>Your Account: {this.state.account}</Title>
        <Table columns={columns} dataSource={this.state.candidates} rowKey="id" />
        {this.state.hasVoted ? (
          <Title level={5}>Already you have voted</Title>
        ) : (
          <Space size="large">
            <Radio.Group value={this.state.activeId} onChange={this.onChangeCandidate}>
              {this.state.candidates.map((candidate, index) => (
                <Radio
                  key={index}
                  value={candidate.id}
                >{candidate.name}</Radio>
              ))}
            </Radio.Group>
            <Button
              type="primary"
              size="large"
              onClick={this.onCastVote}
              disabled={this.state.activeId === 0}
            >Vote</Button>
          </Space>
        )}
      </Space>
      {this.state.loading && (
        <div className="spin-container">
          <Spin />
        </div>
      )}
    </div>
  )
}

export default App;
