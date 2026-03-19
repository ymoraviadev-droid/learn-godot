import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import {
  Plus,
  Trash2,
  ChevronLeft,
  Box,
  FolderTree,
  ChevronDown,
} from "lucide-react";
import type { TreeItem } from "./NodeTreeNode";

function TreeItemRow({
  item,
  depth,
  isLast,
  editable,
  path,
  onUpdate,
  onRemove,
  onAddChild,
  onAddSibling,
}: {
  item: TreeItem;
  depth: number;
  isLast: boolean;
  editable: boolean;
  path: number[];
  onUpdate: (path: number[], updated: Partial<TreeItem>) => void;
  onRemove: (path: number[]) => void;
  onAddChild: (path: number[]) => void;
  onAddSibling: (path: number[]) => void;
}) {
  const children = item.children ?? [];
  const hasChildren = children.length > 0;

  const icon = hasChildren ? (
    <ChevronDown className="node-tree-icon node-tree-icon-parent" />
  ) : (
    <Box className="node-tree-icon node-tree-icon-leaf" />
  );

  return (
    <li className="node-tree-item">
      <div className="node-tree-row group">
        {depth > 0 && (
          <span className="node-tree-branch" aria-hidden>
            {isLast ? "└── " : "├── "}
          </span>
        )}
        {editable ? (
          <div className="node-tree-fields">
            <span className="node-tree-icon-wrap">{icon}</span>
            <input
              type="text"
              value={item.name}
              onChange={(e) => onUpdate(path, { name: e.target.value })}
              placeholder="Name"
              className="node-tree-input node-tree-input-name"
            />
            <input
              type="text"
              value={item.type ?? ""}
              onChange={(e) =>
                onUpdate(path, { type: e.target.value || undefined })
              }
              placeholder="Type"
              className="node-tree-input node-tree-input-type"
            />
            <input
              type="text"
              value={item.comment ?? ""}
              onChange={(e) =>
                onUpdate(path, { comment: e.target.value || undefined })
              }
              placeholder="comment"
              className="node-tree-input node-tree-input-comment"
            />
            <div className="node-tree-actions">
              <button
                type="button"
                onClick={() => onAddChild(path)}
                title="הוסף צאצא"
                className="node-tree-action-btn"
              >
                <ChevronLeft className="h-3 w-3" />
                <Plus className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => onAddSibling(path)}
                title="הוסף אח"
                className="node-tree-action-btn"
              >
                <Plus className="h-3 w-3" />
              </button>
              {depth > 0 && (
                <button
                  type="button"
                  onClick={() => onRemove(path)}
                  title="מחק"
                  className="node-tree-action-btn node-tree-action-delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <span className="node-tree-label">
            {icon}
            <span className="node-tree-label-name">{item.name}</span>
            {item.type && (
              <span className="node-tree-label-type">{item.type}</span>
            )}
            {item.comment && (
              <span className="node-tree-label-comment">{item.comment}</span>
            )}
          </span>
        )}
      </div>

      {hasChildren && (
        <ul className="node-tree-children">
          {children.map((child, i) => (
            <TreeItemRow
              key={`${path.join("-")}-${i}`}
              item={child}
              depth={depth + 1}
              isLast={i === children.length - 1}
              editable={editable}
              path={[...path, i]}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onAddChild={onAddChild}
              onAddSibling={onAddSibling}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function NodeTreeView({
  node,
  updateAttributes,
  editor,
}: NodeViewProps) {
  const items: TreeItem[] = node.attrs.items ?? [];
  const editable = editor.isEditable;

  function cloneItems(items: TreeItem[]): TreeItem[] {
    return items.map((item) => ({
      ...item,
      children: item.children ? cloneItems(item.children) : undefined,
    }));
  }

  function getItemAt(items: TreeItem[], path: number[]): TreeItem {
    let current = items[path[0]];
    for (let i = 1; i < path.length; i++) {
      current = current.children![path[i]];
    }
    return current;
  }

  function getParentList(items: TreeItem[], path: number[]): TreeItem[] {
    if (path.length === 1) return items;
    const parentPath = path.slice(0, -1);
    return getItemAt(items, parentPath).children!;
  }

  const onUpdate = (path: number[], updated: Partial<TreeItem>) => {
    const newItems = cloneItems(items);
    const item = getItemAt(newItems, path);
    Object.assign(item, updated);
    updateAttributes({ items: newItems });
  };

  const onRemove = (path: number[]) => {
    const newItems = cloneItems(items);
    const list = getParentList(newItems, path);
    list.splice(path[path.length - 1], 1);
    updateAttributes({ items: newItems });
  };

  const onAddChild = (path: number[]) => {
    const newItems = cloneItems(items);
    const item = getItemAt(newItems, path);
    if (!item.children) item.children = [];
    item.children.push({ name: "" });
    updateAttributes({ items: newItems });
  };

  const onAddSibling = (path: number[]) => {
    const newItems = cloneItems(items);
    const list = getParentList(newItems, path);
    list.splice(path[path.length - 1] + 1, 0, { name: "" });
    updateAttributes({ items: newItems });
  };

  return (
    <NodeViewWrapper>
      <div className="node-tree-wrapper" contentEditable={false}>
        <div className="node-tree-header">
          <FolderTree className="h-3.5 w-3.5" />
          <span>Node Tree</span>
        </div>
        <ul className="node-tree-root">
          {items.map((item, i) => (
            <TreeItemRow
              key={i}
              item={item}
              depth={0}
              isLast={i === items.length - 1}
              editable={editable}
              path={[i]}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onAddChild={onAddChild}
              onAddSibling={onAddSibling}
            />
          ))}
        </ul>
      </div>
    </NodeViewWrapper>
  );
}
