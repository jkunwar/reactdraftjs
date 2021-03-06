import React, { Component } from 'react'
import { Editor } from 'slate-react'
import { Value } from 'slate'
import Plain from 'slate-plain-serializer'
import Html from 'slate-html-serializer'


// Define a React component renderer for our code blocks.
function CodeNode(props) {
    return (
        <pre {...props.attributes}>
            <code>{props.children}</code>
        </pre>
    )
}


function MarkHotkey(options) {
    // Grab our options from the ones passed in.
    const { type, key } = options

    // Return our "plugin" object, containing the `onKeyDown` handler.
    return {
        onKeyDown(event, editor, next) {
            // If it doesn't match our `key`, let other plugins handle it.
            if (!event.ctrlKey || event.key != key) return next()

            // Prevent the default characters from being inserted.
            event.preventDefault()

            // Toggle the mark `type`.
            editor.toggleMark(type)
        },
    }
}

// Create an array of plugins.
const plugins = [
    MarkHotkey({ key: 'b', type: 'bold' }),
    MarkHotkey({ key: '`', type: 'code' }),
    MarkHotkey({ key: 'i', type: 'italic' }),
    MarkHotkey({ key: '~', type: 'strikethrough' }),
    MarkHotkey({ key: 'u', type: 'underline' }),
]

// Refactor block tags into a dictionary for cleanliness.
const BLOCK_TAGS = {
    p: 'paragraph',
    blockquote: 'quote',
    pre: 'code',
}

// Add a dictionary of mark tags.
const MARK_TAGS = {
    em: 'italic',
    strong: 'bold',
    u: 'underline',
}

const rules = [
    // Add our first rule with a deserializing function.
    {
        // Switch deserialize to handle more blocks...
        deserialize(el, next) {
            const type = BLOCK_TAGS[el.tagName.toLowerCase()]
            if (type) {
                return {
                    object: 'block',
                    type: type,
                    data: {
                        className: el.getAttribute('class'),
                    },
                    nodes: next(el.childNodes),
                }
            }
        },
        // Switch serialize to handle more blocks...
        serialize(obj, children) {
            if (obj.object == 'block') {
                switch (obj.type) {
                    case 'paragraph':
                        return <p className={obj.data.get('className')}>{children}</p>
                    case 'quote':
                        return <blockquote>{children}</blockquote>
                    case 'code':
                        return (
                            <pre>
                                <code>{children}</code>
                            </pre>
                        )
                }
            }
        },
    },
    // Add a new rule that handles marks...
    {
        deserialize(el, next) {
            const type = MARK_TAGS[el.tagName.toLowerCase()]
            if (type) {
                return {
                    object: 'mark',
                    type: type,
                    nodes: next(el.childNodes),
                }
            }
        },
        serialize(obj, children) {
            if (obj.object == 'mark') {
                switch (obj.type) {
                    case 'bold':
                        return <strong>{children}</strong>
                    case 'italic':
                        return <em>{children}</em>
                    case 'underline':
                        return <u>{children}</u>
                }
            }
        },
    },
]

// Create a new serializer instance with our `rules` from above.
const html = new Html({ rules })

// Create our initial value...
// Load the initial value from Local Storage or a default.
const initialValue = localStorage.getItem('content') || '<p></p>'

export default class SlateEditor extends Component {

    state = {
        value: html.deserialize(initialValue),
    }

    // On change, update the app's React state with the new editor value.
    onChange = ({ value }) => {
        // When the document changes, save the serialized HTML to Local Storage.
        if (value.document != this.state.value.document) {
            const string = html.serialize(value)
            localStorage.setItem('content', string)
        }

        this.setState({ value })
    }

    // Define a new handler which prints the key that was pressed.
    onKeyDown = (event, editor, next) => {
        if (event.key != 'b' || !event.ctrlKey) return next()
        event.preventDefault()
        editor.toggleMark('bold')
    }

    // Add a `renderBlock` method to render a `CodeNode` for code blocks.
    renderBlock = (props, editor, next) => {
        switch (props.node.type) {
            case 'code':
                return <CodeNode {...props} />
            default:
                return next()
        }
    }

    renderNode = (props, editor, next) => {
        switch (props.node.type) {
            case 'code':
                return (
                    <pre {...props.attributes}>
                        <code>{props.children}</code>
                    </pre>
                )
            case 'paragraph':
                return (
                    <p {...props.attributes} className={props.node.data.get('className')}>
                        {props.children}
                    </p>
                )
            case 'quote':
                return <blockquote {...props.attributes}>{props.children}</blockquote>
            default:
                return next()
        }
    }

    // Add a `renderMark` method to render marks.
    renderMark = (props, editor, next) => {
        const { mark, attributes } = props
        switch (mark.type) {
            case 'bold':
                return <strong {...attributes}>{props.children}</strong>
            case 'italic':
                return <em {...attributes}>{props.children}</em>
            case 'underline':
                return <u {...attributes}>{props.children}</u>
            default:
                return next()
        }
    }
    render() {
        return (
            <div>
                <Editor
                    plugins={plugins}
                    value={this.state.value}
                    onChange={this.onChange}
                    // Add the ability to render our nodes and marks...
                    renderBlock={this.renderNode}
                    renderMark={this.renderMark}
                />
            </div>
        )
    }
}
