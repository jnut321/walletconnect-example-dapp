import React, { Component } from "react";
import styled from "styled-components";
import WalletConnect from "walletconnect";
import BaseLayout from "./components/BaseLayout";
import AssetRow from "./components/AssetRow";
import Button from "./components/Button";
import Column from "./components/Column";
import { fonts } from "./styles";
import { apiGetAccountBalances } from "./helpers/api";
import { parseAccountBalances } from "./helpers/parsers";

const StyledLanding = styled(Column)`
  height: 600px;
`;

const StyledButtonContainer = styled(Column)`
  width: 250px;
  margin: 50px 0;
`;

const StyledConnectButton = styled(Button)`
  border-radius: 8px;
  font-size: ${fonts.size.medium};
  height: 44px;
  width: 100%;
  margin: 12px 0;
`;

const StyledBalances = styled(StyledLanding)`
  padding-top: 60px;
`;

const StyledTestButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledTestButton = styled(Button)`
  border-radius: 8px;
  font-size: ${fonts.size.medium};
  height: 44px;
  width: 100%;
  margin: 12px;
`;

const defaultConfig = {
  bridgeUrl: "https://test-bridge.walletconnect.org",
  dappName: "Example Dapp"
};

window.webConnector = new WalletConnect(defaultConfig);

class App extends Component {
  state = {
    fetching: false,
    network: "mainnet",
    showModal: false,
    uri: "",
    accounts: [],
    address: "",
    result: {},
    assets: []
  };

  toggleModal = async newState => {
    // toggle modal
    await this.setState({ showModal: !this.state.showModal, ...newState });

    if (!this.state.showModal) {
      // clear uri/result when closing modal
      await this.setState({ uri: "", result: {} });

      if (!this.state.accounts.length) {
        // reset session when closing modal without accounts
        window.webConnector = new WalletConnect(defaultConfig);
      }
    }
  };

  walletConnectInit = async () => {
    /**
     *  Initiate WalletConnect session
     */
    await window.webConnector.initSession();

    /**
     *  Get accounts (type: <Array>)
     */
    let accounts = window.webConnector.accounts;

    /**
     *  Check if accounts is empty array
     */
    if (!accounts.length) {
      await this.setState({ fetching: true });

      // If there is no accounts, prompt the user to scan the QR code
      const uri = window.webConnector.uri;

      // Display QR Code
      this.toggleModal({ uri });

      // Listen for session confirmation from wallet
      await window.webConnector.listenSessionStatus();

      // Get accounts after session status is resolved
      accounts = window.webConnector.accounts;
      await this.setState({ fetching: false });
    }

    if (accounts && accounts.length) {
      // Close Modal if accounts are available
      if (this.state.showModal) {
        this.toggleModal();
      }

      // Display account balances
      const { network } = this.state;
      const address = accounts[0];
      const { data } = await apiGetAccountBalances(address, network);
      const assets = parseAccountBalances(data);

      await this.setState({ accounts, address, assets });
    }
  };

  testSendTransaction = async () => {
    // test transaction
    const tx = {
      from: "0xab12...1cd",
      to: "0x0",
      nonce: 1,
      gas: 100000,
      value: 0,
      data: "0x0"
    };

    // send transaction
    const result = await window.webConnector.sendTransaction(tx);

    // display result
    this.toggleModal({ result });
  };

  testSignMessage = async () => {
    // test message
    const msg = "My email is john@doe.com - 1537836206101";

    // sign message
    const result = await window.webConnector.signMessage(msg);

    // display result
    this.toggleModal({ result });
  };

  testSignTypedData = async () => {
    // test typed data
    const msgParams = [
      {
        type: "string",
        name: "Message",
        value: "My email is john@doe.com"
      },
      {
        type: "uint32",
        name: "A number",
        value: "1537836206101"
      }
    ];
    // sign typed data
    const result = await window.webConnector.signTypedData(msgParams);

    // display result
    this.toggleModal({ result });
  };

  render = () => (
    <BaseLayout
      address={this.state.address}
      uri={this.state.uri}
      showModal={this.state.showModal}
      toggleModal={this.toggleModal}
    >
      {!this.state.address && !this.state.assets.length ? (
        <StyledLanding center>
          <h2>Check your Ether & Token balances</h2>
          <StyledButtonContainer>
            <StyledConnectButton
              left
              color="walletconnect"
              onClick={this.walletConnectInit}
              fetching={this.state.fetching}
            >
              {"Connect to WalletConnect"}
            </StyledConnectButton>
          </StyledButtonContainer>
        </StyledLanding>
      ) : (
        <StyledBalances>
          <h3>Actions</h3>
          <Column center>
            <StyledTestButtonContainer>
              <StyledTestButton
                left
                color="walletconnect"
                onClick={this.testSendTransaction}
                fetching={this.state.fetching}
              >
                {"Send Test Transaction"}
              </StyledTestButton>

              <StyledTestButton
                left
                color="walletconnect"
                onClick={this.testSignMessage}
                fetching={this.state.fetching}
              >
                {"Sign Test Message"}
              </StyledTestButton>

              <StyledTestButton
                left
                color="walletconnect"
                onClick={this.testSignTypedData}
                fetching={this.state.fetching}
              >
                {"Sign Test Typed Data"}
              </StyledTestButton>
            </StyledTestButtonContainer>
          </Column>
          <h3>Balances</h3>
          <Column center>
            {this.state.assets.map(asset => (
              <AssetRow key={asset.symbol} asset={asset} />
            ))}
          </Column>
        </StyledBalances>
      )}
    </BaseLayout>
  );
}

export default App;
