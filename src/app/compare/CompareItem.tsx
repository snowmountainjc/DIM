import React from 'react';
import { DimItem } from '../inventory/item-types';
import ItemTagSelector from '../item-popup/ItemTagSelector';
import LockButton from '../item-popup/LockButton';
import { AppIcon, searchIcon } from '../shell/icons';
import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import ItemSockets from '../item-popup/ItemSockets';
import { StatInfo } from './Compare';
import CompareStat from './CompareStat';
import ItemTalentGrid from '../item-popup/ItemTalentGrid';

export default function CompareItem({
  item,
  stats,
  itemClick,
  remove,
  highlight,
  setHighlight
}: {
  item: DimItem;
  stats: StatInfo[];
  highlight: number | string | undefined;
  itemClick(item: DimItem): void;
  remove(item: DimItem): void;
  setHighlight(value?: string | number): void;
}) {
  return (
    <div className="compare-item">
      <div className="compare-item-header">
        <div className="icon comp-lock-icon">
          {item.lockable && <LockButton item={item} type="lock" />}
          {item.isDestiny1() && item.trackable && <LockButton item={item} type="track" />}
        </div>
        <ItemTagSelector item={item} />
        <div className="close" onClick={() => remove(item)} />
      </div>
      <div className="item-name" onClick={() => itemClick(item)}>
        {item.name} <AppIcon icon={searchIcon} />
      </div>
      <ConnectedInventoryItem item={item} />
      {stats.map((stat) => (
        <CompareStat
          key={stat.id}
          item={item}
          stat={stat}
          setHighlight={setHighlight}
          highlight={highlight}
        />
      ))}
      {item.talentGrid && <ItemTalentGrid item={item} perksOnly={true} />}
      {item.isDestiny2() && item.sockets && <ItemSockets item={item} />}
    </div>
  );
}
