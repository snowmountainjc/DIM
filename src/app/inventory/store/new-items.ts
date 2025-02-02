import { get, set } from 'idb-keyval';
import { getActivePlatform } from '../../accounts/platforms';
import { DestinyAccount } from '../../accounts/destiny-account';
import { DimItem } from '../item-types';
import { DimStore } from '../store-types';
import store from '../../store/store';
import { setNewItems } from '../actions';
import { handleLocalStorageFullError } from '../../compatibility';
import { del } from 'app/storage/idb-keyval';

const _removedNewItems = new Set<string>();

// TODO: Make this a class and instantiate it per stores. Need the Profile objects to really sell it.

/**
 * This service helps us keep track of new items. They are persisted to indexedDB between sessions.
 * They are tracked whether or not the option to display them is on.
 */
export const NewItemsService = {
  /**
   * Should this item display as new? Note the check for previousItems size, so that
   * we don't mark everything as new on the first load.
   */
  isItemNew(id: string, previousItems: Set<string>, newItems: Set<string>) {
    let isNew = false;
    if (newItems.has(id)) {
      isNew = true;
    } else if (_removedNewItems.has(id)) {
      isNew = false;
    } else if (previousItems.size) {
      // Zero id check is to ignore general items and consumables
      isNew = id !== '0' && !previousItems.has(id);
      if (isNew) {
        newItems.add(id);
      }
    }
    return isNew;
  },

  dropNewItem(item: DimItem) {
    if (!store.getState().inventory.newItems.has(item.id)) {
      return;
    }
    _removedNewItems.add(item.id);
    const account = getActivePlatform();
    return this.loadNewItems(account).then((newItems) => {
      newItems.delete(item.id);
      store.dispatch(setNewItems(newItems));
      this.saveNewItems(newItems, account, item.destinyVersion);
    });
  },

  clearNewItems(stores: DimStore[], account: DestinyAccount) {
    if (!stores || !account) {
      return;
    }
    store.dispatch(setNewItems(new Set()));
    this.saveNewItems(new Set(), account);
  },

  async loadNewItems(account: DestinyAccount): Promise<Set<string>> {
    if (account) {
      const key = newItemsKey(account);
      let v = await get<Set<string> | undefined>(key);
      if (!v) {
        const oldKey = oldNewItemsKey(account);
        v = await get<Set<string> | undefined>(oldKey);
        if (v) {
          await set(key, v);
          await del(oldKey);
        }
      }

      return v || new Set<string>();
    }
    return new Set<string>();
  },

  async saveNewItems(newItems: Set<string>, account: DestinyAccount) {
    try {
      return await set(newItemsKey(account), newItems);
    } catch (e) {
      return handleLocalStorageFullError(e);
    }
  },

  buildItemSet(stores: DimStore[]) {
    const itemSet = new Set<string>();
    stores.forEach((store) => {
      store.items.forEach((item) => {
        itemSet.add(item.id);
      });
    });
    return itemSet;
  },

  applyRemovedNewItems(newItems: Set<string>) {
    _removedNewItems.forEach((id) => newItems.delete(id));
    _removedNewItems.clear();
  }
};

function newItemsKey(account: DestinyAccount) {
  return `newItems-m${account.membershipId}-d${account.destinyVersion}`;
}

function oldNewItemsKey(account: DestinyAccount) {
  return `newItems-m${account.membershipId}-p${account.originalPlatformType}-d${account.destinyVersion}`;
}
