"use client";
import BiasChip from './BiasChip';
import { useLang } from './LanguageProvider';
import { t } from '../lib/messages';

export default function SourceTile({
  headline,
  lean,
  reason,
  url,
  sourceName,
  logoUrl,
}: {
  headline: string;
  lean: -2 | -1 | 0 | 1 | 2;
  reason: string;
  url: string;
  sourceName?: string;
  logoUrl?: string | null;
}) {
  const logo = logoUrl || '/logos/placeholder.png';
  const { lang } = useLang();
  return (
    <li className="border rounded-xl p-3 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="w-5 h-5 rounded" />
          <div className="text-sm font-medium">{headline}</div>
        </div>
        <BiasChip score={lean} />
      </div>
      <div className="text-xs text-slate-600">{reason}</div>
      <div className="flex items-center gap-2 mt-1">
        {sourceName && <span className="text-xs text-slate-700">{sourceName}</span>}
        <a href={url} target="_blank" rel="noopener nofollow" className="text-blue-600 text-sm">{t('readSource', lang)}</a>
      </div>
    </li>
  );
}
