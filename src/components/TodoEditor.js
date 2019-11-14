import React from 'react'
import { Map } from 'immutable';
import {
    Editor,
    EditorState,
    DefaultDraftBlockRenderMap,
    RichUtils,
} from 'draft-js';
import TodoBlock from './TodoBlock'

const TODO_TYPE = 'todo';

const BLOCK = {
    UNSTYLED: 'unstyled'
}
/*
Returns default block-level metadata for various block type. Empty object otherwise.
*/
const getDefaultBlockData = (blockType, initialData = {}) => {
    switch (blockType) {
        case TODO_TYPE: return { checked: false };
        default: return initialData;
    }
};

/*
Changes the block type of the current block.
*/
const resetBlockType = (editorState, newType = BLOCK.UNSTYLED) => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const key = selectionState.getStartKey();
    const blockMap = contentState.getBlockMap();
    const block = blockMap.get(key);
    let newText = '';
    const text = block.getText();
    if (block.getLength() >= 2) {
        newText = text.substr(1);
    }
    const newBlock = block.merge({
        text: newText,
        type: newType,
        data: getDefaultBlockData(newType),
    });
    const newContentState = contentState.merge({
        blockMap: blockMap.set(key, newBlock),
        selectionAfter: selectionState.merge({
            anchorOffset: 0,
            focusOffset: 0,
        }),
    });
    return EditorState.push(editorState, newContentState, 'change-block-type');
};

/*
A higher-order function.
*/
const getBlockRendererFn = (getEditorState, onChange) => (block) => {
    const type = block.getType();
    switch (type) {
        case TODO_TYPE:
            return {
                component: TodoBlock,
                props: {
                    onChange,
                    getEditorState,
                },
            };
        default:
            return null;
    }
};

class TodoEditor extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            editorState: EditorState.createEmpty(),
            todo: ''
        };

        this.blockRenderMap = Map({
            [TODO_TYPE]: {
                element: 'div',
            }
        }).merge(DefaultDraftBlockRenderMap);


        this.getEditorState = () => this.state.editorState;

        this.blockRendererFn = getBlockRendererFn(this.getEditorState, this.onChange);
    }
    onChange = (editorState) => this.setState({ editorState });

    componentDidMount() {
        this.refs.editor.focus();
    }

    blockStyleFn(block) {
        switch (block.getType()) {
            case TODO_TYPE:
                return 'block block-todo';
            default:
                return 'block';
        }
    }

    handleBeforeInput = (str) => {
        if (str !== ']') {
            return false;
        }
        const { editorState } = this.state;
        /* Get the selection */
        const selection = editorState.getSelection();

        /* Get the current block */
        const currentBlock = editorState.getCurrentContent().getBlockForKey(selection.getStartKey());
        const blockType = currentBlock.getType();
        const blockLength = currentBlock.getLength();
        if (blockLength === 1 && currentBlock.getText() === '[') {
            this.onChange(resetBlockType(editorState, blockType !== TODO_TYPE ? TODO_TYPE : 'unstyled'));
            return true;
        }
        return false;
    }

    handleKeyCommand = (command) => {
        const { editorState } = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.onChange(newState);
            return true;
        }
        return false;
    }

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value })
    }

    handleSubmit = () => {
        const str = '[]'
        this.handleBeforeInput(str)
    }

    render() {
        return (
            <React.Fragment>
                <Editor
                    ref="editor"
                    placeholder="Write here. Type [ ] to add a todo ..."
                    editorState={this.state.editorState}
                    onChange={this.onChange}
                    blockStyleFn={this.blockStyleFn}
                    blockRenderMap={this.blockRenderMap}
                    blockRendererFn={this.blockRendererFn}
                    handleBeforeInput={this.handleBeforeInput}
                    handleKeyCommand={this.handleKeyCommand}
                />
                <br />
                <div>
                    <input type="text" name="todo" onChange={this.handleChange} />
                    <button onClick={this.handleSubmit}>Submit</button>
                </div>
            </React.Fragment>
        );
    }
}

export default TodoEditor