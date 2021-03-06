import Immutable from 'immutable';
import { expect } from 'chai';
import jsdom from 'mocha-jsdom';
import reducer, { initialState } from './executionReducer';
import * as actions from '../actions';

describe('execution reducer', () => {

    // Mock stuff for execution
    jsdom();
    global.nv = {};

    it('should return the initial state', () => {
        expect(reducer(undefined, {})).to.eql(initialState);
    });

    it('should update the data on received data', () => {
        const action = {
            type: actions.RECEIVED_DATA,
            name: 'github',
            data: {repos: 12}
        };
        const newState = initialState.setIn(['data', 'github', 'repos'], 12);
        expect(reducer(initialState, action).toJS()).to.eql(newState.toJS());
    });

    it('should clear block results and executed state on update', () => {
        const action = {
            type: actions.UPDATE_BLOCK,
            id: '12'
        };
        const beforeState = initialState
            .setIn(['results', '12'], 120)
            .set('blocksExecuted', initialState.get('blocksExecuted').add('12'));
        expect(reducer(beforeState, action).toJS()).to.eql(initialState.toJS());
    });

    it('should clear block results and executed state on update', () => {
        const action = {
            type: actions.DELETE_BLOCK,
            id: '12'
        };
        const beforeState = initialState
            .setIn(['results', '12'], 120)
            .set('blocksExecuted', initialState.get('blocksExecuted').add('12'));
        expect(reducer(beforeState, action).toJS()).to.eql(initialState.toJS());
    });

    it('should clear datasource data when the datasource is deleted', () => {
        const action = {
            type: actions.DELETE_DATASOURCE,
            id: 'github'
        };
        const beforeState = initialState.setIn(['data', 'github', 'repos'], 12);
        expect(reducer(beforeState, action).toJS()).to.eql(initialState.toJS());
    });

    it('should clear datasource data when the datasource is updated', () => {
        const action = {
            type: actions.UPDATE_DATASOURCE,
            id: 'github'
        };
        const beforeState = initialState.setIn(['data', 'github', 'repos'], 12);
        expect(reducer(beforeState, action).toJS()).to.eql(initialState.toJS());
    });


    it('should save results and mark execution on EXECUTE action', () => {
        const id = '1';
        const code = 'return 12 + 5;';
        const action = {
            type: actions.EXECUTE,
            id,
            code
        };
        const expectedState = initialState
            .setIn(['results', id], 17)
            .set('blocksExecuted', initialState.get('blocksExecuted').add(id));
        expect(reducer(initialState, action).toJS()).to.eql(expectedState.toJS());
    });

    it('should save errors as the result', () => {
        const id = '1';
        const code = 'return 5 ++ 3;';
        let result;
        try {
            eval(code);
        } catch (err) {
            result = err;
        }
        const action = {
            type: actions.EXECUTE,
            id,
            code
        };
        const expectedState = initialState
            .setIn(['results', id], result)
            .set('blocksExecuted', initialState.get('blocksExecuted').add(id));
        expect(reducer(initialState, action).toJS()).to.eql(expectedState.toJS());
    });

    it('should run auto and hidden code blocks, in order, on EXECUTE_AUTO', () => {
        const blocks = Immutable.fromJS({
            '0': {
                id: '0',
                type: 'code',
                content: 'this.number = 500; return this.number;',
                option: 'runnable'
            },
            '1': {
                id: '1',
                type: 'code',
                content: 'this.number = 100; return this.number;',
                option: 'auto'
            },
            '2': {
                id: '2',
                type: 'code',
                content: 'return this.number * 2;',
                option: 'hidden'
            }
        });
        const content = Immutable.List(['1', '0', '2']);
        const expectedState = initialState.set(
            'results',
            Immutable.fromJS({
                '1': 100,
                '2': 200
            })
        ).set('blocksExecuted', Immutable.Set(['1', '2'])).set(
            'executionContext', Immutable.Map({
                number: 100
            })
        );
        const action = {
            type: actions.EXECUTE_AUTO,
            blocks,
            content
        };
        expect(reducer(initialState, action).toJS()).to.eql(expectedState.toJS());
    });

});
