import { getSettings } from '@/lib/settings';
import FaqClient from './FaqClient';

export const metadata = { title: 'Frequently Asked Questions — ATN Mega Store' };

export default async function FaqPage() {
  const s = await getSettings();
  return <FaqClient email={s.site_email} interacEmail={s.interac_email} />;
}
