import type { NewStoreReturnAddressInput, StoreReturnAddress } from '@popup-cube/shared';
import { supabase } from './supabase';

export class StoreReturnAddressError extends Error {}

const SELECT_COLUMNS =
  'id, store_id, label, recipient_name, phone, postal_code, address_line1, address_line2, is_default, created_at, updated_at';

export async function listStoreReturnAddresses(storeId: string): Promise<StoreReturnAddress[]> {
  const { data, error } = await supabase
    .from('store_return_addresses')
    .select(SELECT_COLUMNS)
    .eq('store_id', storeId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw new StoreReturnAddressError(error.message);
  return data ?? [];
}

export async function createStoreReturnAddress(
  storeId: string,
  input: NewStoreReturnAddressInput,
  makeDefault: boolean,
): Promise<StoreReturnAddress> {
  const { count } = await supabase
    .from('store_return_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId);

  const isFirst = (count ?? 0) === 0;
  const shouldBeDefault = isFirst || makeDefault;

  if (shouldBeDefault && !isFirst) {
    await unsetOtherDefaults(storeId);
  }

  const { data, error } = await supabase
    .from('store_return_addresses')
    .insert({
      store_id: storeId,
      label: input.label.trim(),
      recipient_name: input.recipient_name.trim(),
      phone: input.phone.trim(),
      postal_code: input.postal_code.trim(),
      address_line1: input.address_line1.trim(),
      address_line2: input.address_line2?.trim() || null,
      is_default: shouldBeDefault,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) throw new StoreReturnAddressError(error.message);
  return data;
}

export type UpdateStoreReturnAddressInput = Omit<NewStoreReturnAddressInput, 'is_default'>;

export async function updateStoreReturnAddress(
  addressId: string,
  input: UpdateStoreReturnAddressInput,
): Promise<void> {
  const { error } = await supabase
    .from('store_return_addresses')
    .update({
      label: input.label.trim(),
      recipient_name: input.recipient_name.trim(),
      phone: input.phone.trim(),
      postal_code: input.postal_code.trim(),
      address_line1: input.address_line1.trim(),
      address_line2: input.address_line2?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', addressId);

  if (error) throw new StoreReturnAddressError(error.message);
}

export async function deleteStoreReturnAddress(addressId: string): Promise<void> {
  const { error } = await supabase.from('store_return_addresses').delete().eq('id', addressId);
  if (error) throw new StoreReturnAddressError(error.message);
}

export async function setDefaultStoreReturnAddress(storeId: string, addressId: string): Promise<void> {
  await unsetOtherDefaults(storeId);
  const { error } = await supabase
    .from('store_return_addresses')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', addressId);
  if (error) throw new StoreReturnAddressError(error.message);
}

async function unsetOtherDefaults(storeId: string): Promise<void> {
  const { error } = await supabase
    .from('store_return_addresses')
    .update({ is_default: false, updated_at: new Date().toISOString() })
    .eq('store_id', storeId)
    .eq('is_default', true);
  if (error) throw new StoreReturnAddressError(error.message);
}
