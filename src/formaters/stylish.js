import _keys from 'lodash/keys.js';
import _isObject from 'lodash/isObject.js';

import { nodeStates } from '../constants.js';

const indentSize = 4;

const getIndent = (depth) => ' '.repeat(depth);

const makeStylishFormat = (diff, treeDepth = 0) => {
  const defaultIndentLength = treeDepth * indentSize;

  const largeIndent = getIndent(defaultIndentLength + indentSize);
  const nestedObjectIndent = getIndent((treeDepth + 1) * indentSize + indentSize);
  const smallIndent = getIndent(defaultIndentLength + indentSize / 2);
  const nestedIdent = getIndent(defaultIndentLength);

  const stringify = (data) => {
    const stringifyObject = (object) => {
      const string = _keys(object)
        .map((key) => `${nestedObjectIndent}${key}:  ${stringify(object[key])}`)
        .join('\n');

      return `{\n${string}\n${largeIndent}}`;
    };
    return _isObject(data) ? stringifyObject(data) : `${data}`;
  };

  const nodeStateToFormatting = {
    [nodeStates.ADDED]: ({ name, value }) => `${smallIndent}+ ${name}: ${stringify(value, treeDepth)}`,
    [nodeStates.DELETED]: ({ name, value }) => `${smallIndent}- ${name}: ${stringify(value, treeDepth)}`,
    [nodeStates.UNCHANGED]: ({ name, value }) => `${largeIndent}${name}: ${stringify(value, treeDepth)}`,
    [nodeStates.NESTED]: ({ name, children }) => `${largeIndent}${name}: ${makeStylishFormat(children, treeDepth + 1)}`,
    [nodeStates.CHANGED]: (node) => {
      const { name, addedValue, removedValue } = node;
      const getAddString = nodeStateToFormatting[nodeStates.ADDED];
      const getRemovedString = nodeStateToFormatting[nodeStates.DELETED];

      const addedString = getAddString({ name, value: addedValue }, treeDepth);
      const deletedString = getRemovedString({ name, value: removedValue }, treeDepth);

      return [addedString, deletedString];
    },
  };

  const formattedDiff = diff
    .flatMap((element) => nodeStateToFormatting[element.state](element, treeDepth))
    .join('\n');

  return `{\n${formattedDiff}\n${nestedIdent}}`;
};

export default makeStylishFormat;
