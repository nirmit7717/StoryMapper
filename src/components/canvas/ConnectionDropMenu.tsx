/**
 * StoryMapper — Connection Drop Menu
 * 
 * When a user drags a connector from a node's output handle and 
 * releases it on empty canvas space, this menu appears at the drop
 * position, prompting the user to select which node type to create.
 * The new node is then auto-connected to the source.
 */

import { useEffect, useRef, useCallback } from 'react';

interface DropMenuItem {
  type: string;
  icon: string;
  label: string;
  desc: string;
}

const MENU_ITEMS: DropMenuItem[] = [
  { type: 'script-editor', icon: '🎬', label: 'Scene', desc: 'Script content' },
  { type: 'branch', icon: '🔀', label: 'Branch', desc: 'Decision point' },
  { type: 'end', icon: '■', label: 'End', desc: 'Story ending' },
];

interface ConnectionDropMenuProps {
  x: number;
  y: number;
  onSelect: (type: string) => void;
  onClose: () => void;
}

export function ConnectionDropMenu({ x, y, onSelect, onClose }: ConnectionDropMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Delay to avoid immediate close from the mouseup that opened the menu
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleSelect = useCallback((type: string) => {
    onSelect(type);
    onClose();
  }, [onSelect, onClose]);

  return (
    <div
      ref={menuRef}
      className="drop-menu"
      style={{ left: x, top: y }}
    >
      <div className="drop-menu__title">Create node</div>
      {MENU_ITEMS.map((item) => (
        <button
          key={item.type}
          className="drop-menu__item"
          onClick={() => handleSelect(item.type)}
        >
          <span className="drop-menu__item-icon">{item.icon}</span>
          <span>
            <span className="drop-menu__item-label">{item.label}</span>
            <br />
            <span className="drop-menu__item-desc">{item.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
