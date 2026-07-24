import type { NewAddressInput, UserAddress } from '@popup-cube/shared';
import { supabase } from './supabase';

export class AddressError extends Error {}

const SELECT_COLUMNS =
  'id, user_id, label, recipient_name, phone, postal_code, address_line1, address_line2, is_default, created_at, updated_at';

/** 본인 배송지 전체 조회 — 기본 배송지가 위로 오게 정렬. */
export async function listMyAddresses(): Promise<UserAddress[]> {
  const { data, error } = await supabase
    .from('user_addresses')
    .select(SELECT_COLUMNS)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) throw new AddressError(error.message);
  return data ?? [];
}

/**
 * 배송지 추가. 이 사용자의 첫 배송지면 자동으로 기본 배송지로 지정.
 * `makeDefault`를 true로 넘기면 기존 기본 배송지는 먼저 해제.
 */
export async function createAddress(
  userId: string,
  input: NewAddressInput,
  makeDefault: boolean
): Promise<UserAddress> {
  const { count } = await supabase
    .from('user_addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const isFirstAddress = (count ?? 0) === 0;
  const shouldBeDefault = isFirstAddress || makeDefault;

  if (shouldBeDefault && !isFirstAddress) {
    await unsetOtherDefaults(userId);
  }

  const { data, error } = await supabase
    .from('user_addresses')
    .insert({
      user_id: userId,
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

  if (error) throw new AddressError(error.message);
  return data;
}

export type UpdateAddressInput = Omit<NewAddressInput, 'is_default'>;

export async function updateAddress(addressId: string, input: UpdateAddressInput): Promise<void> {
  const { error } = await supabase
    .from('user_addresses')
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

  if (error) throw new AddressError(error.message);
}

export async function deleteAddress(addressId: string): Promise<void> {
  const { error } = await supabase.from('user_addresses').delete().eq('id', addressId);
  if (error) throw new AddressError(error.message);
}

/** 기본 배송지 지정 — 같은 사용자의 다른 배송지는 먼저 기본 해제(원자적이진 않지만 1인 세션이라 데모 범위에서 안전). */
export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  await unsetOtherDefaults(userId);
  const { error } = await supabase.from('user_addresses').update({ is_default: true }).eq('id', addressId);
  if (error) throw new AddressError(error.message);
}

async function unsetOtherDefaults(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_addresses')
    .update({ is_default: false })
    .eq('user_id', userId)
    .eq('is_default', true);
  if (error) throw new AddressError(error.message);
}
