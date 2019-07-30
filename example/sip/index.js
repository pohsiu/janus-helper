import React from 'react';
import { connect } from 'react-redux';
import Icon from '@material-ui/core/Icon';
import Phone from '@material-ui/icons/Phone';
import CallEnd from '@material-ui/icons/CallEnd';
import Refresh from '@material-ui/icons/Refresh';
import Button from 'd8ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import FilterList from 'd8ui/core/FilterList';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import moment from 'moment';
import Snackbar from 'd8ui/core/Snackbar';
import ComposeSip from './ComposeSip';
import RemainingTime from './RemainingTime';

// console.log(modelMap);
const styles = theme => ({
  root: {
    backgroundColor: '#f2f2f2',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    minWidth: '25%',
    padding: 12,
    paddingTop: 24,
  },
  btnClass: {
    ...theme.buttons.accept,
    position: 'absolute',
    bottom: 48,
    width: '65%',
  },
  btnContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelBtnClass: {
    ...theme.buttons.reject,
    position: 'absolute',
    bottom: 48,
    width: '65%',
  },
  cancelBtnContent: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});
class ThirdPartyCall extends React.PureComponent {
  constructor(props) {
    super(props);
    this.timers = [];
    this.state = {
      currentNumber: '__EMPTY__',
      sipStatus: 'idle',
      successSnackOpen: false,
      errorSnackOpen: false,
      pluginState: 'idle',
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (props.senderInfo.number && state.currentNumber === '__EMPTY__') {
      return {
        ...state,
        currentNumber: props.senderInfo.number,
      };
    }
    if (state.currentNumber === '__EMPTY__') {
      return {
        ...state,
        currentNumber: '',
      };
    }
    return state;
  }

  retryRegister = () => {
    if (this.props.janus.plugins.sip && this.sipHandler) {
      this.props.janus.plugins.sip.regist();
    }
  }

  refetchInfo = () => {
    const {
      getSipInfos,
    } = this.props;
    getSipInfos().then((result) => {
    }).catch((e) => {
      this.setSnackVisible('errorSnackOpen')(true);
    });
  }

  renderInjectPlugin = () => {
    const {
      sipInfo,
      userInfo,
      janus,
    } = this.props;
    const config = {
      ...sipInfo,
      userInfo: {
        ...sipInfo.userInfo,
        name: userInfo.user_name,
      },
    };
    const callbacks = {
      oncleanup: () => {
      },
      onlocalstream: (stream) => {
      },
      onremotestream: (stream) => {
        this.props.onRemoteSip(stream);
      },
      success: (pluginHandler) => {
        this.sipHandler = pluginHandler;
        this.setState({ pluginState: 'registering' });
      },
      errorCallback: (e) => {
        this.setSnackVisible('errorSnackOpen')(true);
        this.setState({ pluginState: 'idle' });
      },
      failed: () => {},
      registered: () => {
        this.setSnackVisible('successSnackOpen')(true);
        this.setState({ pluginState: 'registered' });
      },
      incomingcall: (userInfo, data) => {
        this.handlerIncomeCall(data); // now accepted directly;
      },
      accepted: () => {
        this.setState({ sipStatus: 'connecting' });
      },
      calling: () => {
        this.setState({ sipStatus: 'calling' });
        const { currentNumber } = this.state;
        this.addPhoneRecord(currentNumber, 'connecting');
      },
      hangup: () => {
        this.setState({ sipStatus: 'idle' });
        this.updatePhoneRecord('finished')
      },
      reject: () => {
        this.setState({ sipStatus: 'rejected' });
        this.updatePhoneRecord('rejected');
      },
      unavailable: () => {
        this.setState({ sipStatus: 'timeout' });
        this.updatePhoneRecord('timeout');
        this.setStateByDelay({ sipStatus: 'idle' }, 1000);
      },
    };
    return (<ComposeSip janus={janus} config={config} callbacks={callbacks} />);
  }

  handlerIncomeCall = (data) => {
    const accepted = true;
    this.props.janus.plugins.sip.phoneCallAction(accepted, data);
  };

  onClickPhoneDial = () => {
    const { currentNumber } = this.state;
    this.onSipCall(currentNumber);
  }

  onSipCall = (number) => {
    let dial = number;
    if (number[0] === '0' && number[1] === '2') {
      dial = `9${number.slice(2)}`;
    } else if (number[0] === '0') {
      dial = `9${number}`;
    }
    console.log('=== [SIP] === ', dial);
    this.props.janus.plugins.sip.doCall(dial);
  }

  onClickCancelDial = () => {
    this.setState({ sipStatus: 'idle' });
    this.props.janus.plugins.sip.doHangup();
  }

  onTextChange = (event, value) => {
    this.setState({
      currentNumber: value,
    });
  }

  filter = text => history => history.number.includes(text);

  onItemClick = number => () => {
    this.state.currentNumber = number;
    this.onSipCall(number);
  }

  setSnackVisible = field => (key) => {
    this.setState({ [field]: key });
  };

  handleSnack = snack => (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setSnackVisible(snack)(false);
  };

  normalizeTime = timestamp => moment(timestamp).format('MM/DD h:mm a');

  renderDefault = (classes) => {
    const { records } = this.props;
    const renderItem = object => (
      <ListItem button key={object.id} onClick={this.onItemClick(object.number)}>
        <ListItemText primary={object.number} secondary={this.normalizeTime(object.created_at)} />
      </ListItem>
    );
    return (
      <React.Fragment>
        <FilterList
          items={records}
          textFieldPlaceholder="請輸入電話號碼"
          filterCallback={this.filter}
          renderItem={renderItem}
          onTextChange={this.onTextChange}
          textFieldProps={{
            value: this.state.currentNumber,
          }}
          renderEmptyList={() => {}}
        />
        <Button className={classes.btnClass} onClick={this.onClickPhoneDial}>
          <div className={classes.btnContent}>
            <Icon>
              <Phone />
            </Icon>
            我要通話
          </div>
        </Button>
      </React.Fragment>
    );
  }

  renderConnecting = classes => (
    <React.Fragment>
      <div>{this.state.currentNumber}</div>
      <Button className={classes.cancelBtnClass} onClick={this.onClickCancelDial}>
        <div className={classes.cancelBtnContent}>
          <Icon>
            <CallEnd />
          </Icon>
          結束通話
        </div>
      </Button>
    </React.Fragment>
  );

  renderCalling = classes => (
    <React.Fragment>
      <div>{this.state.currentNumber}</div>
      <div>等待對方接聽</div>
      <Button className={classes.cancelBtnClass} onClick={this.onClickCancelDial}>
        <div className={classes.cancelBtnContent}>
          <Icon>
            <CallEnd />
          </Icon>
          取消通話
        </div>
      </Button>
    </React.Fragment>
  );

  renderDisconnect = classes => (
    <div className={classes.root}>
      <React.Fragment>
        <Button className={classes.cancelBtnClass} onClick={this.refetchInfo}>
          <div className={classes.cancelBtnContent}>
            <Icon>
              <Refresh />
            </Icon>
            連線失敗，重新載入
          </div>
        </Button>
      </React.Fragment>
    </div>
  );

  renderRegistering = classes => (
    <div>
      SIP連接中...
    </div>
  );

  renderRegistFailed = classes => (
    <React.Fragment>
      <Button className={classes.cancelBtnClass} onClick={this.retryRegister}>
        <div className={classes.cancelBtnContent}>
          <Icon>
            <Refresh />
          </Icon>
          連線失敗，重試？
        </div>
      </Button>
    </React.Fragment>
  );

  render() {
    const {
      visible,
      classes,
      sipInfo,
    } = this.props;
    const { sipStatus, pluginState } = this.state;
    if (!visible) return null;
    if (!sipInfo) return this.renderDisconnect(classes);
    if (pluginState !== 'registered') {
      return (
        <div className={classes.root}>
          {this.renderInjectPlugin()}
          {pluginState === 'registering' && this.renderRegistering(classes)}
          {pluginState === 'idle' && this.renderRegistFailed(classes)}
        </div>
      );
    }
    return (
      <div className={classes.root}>
        {this.renderInjectPlugin()}
        {sipStatus === 'idle' && this.renderDefault(classes)}
        {sipStatus === 'calling' && this.renderCalling(classes)}
        {sipStatus === 'connecting' && this.renderConnecting(classes)}
        {sipStatus === 'rejected' && (<div>Rejected</div>)}
        {sipStatus === 'timeout' && (<div>timeout</div>)}
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          autoHideDuration={3000}
          variant="error"
          open={this.state.errorSnackOpen}
          onClose={this.handleSnack('errorSnackOpen')}
          message="SIP連線失敗，請重試"
        />
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          autoHideDuration={3000}
          variant="success"
          open={this.state.successSnackOpen}
          onClose={this.handleSnack('successSnackOpen')}
          message="SIP連線成功"
        />
      </div>
    );
  }
}

export default ThirdPartyCall;
