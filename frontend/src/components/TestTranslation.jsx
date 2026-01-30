import { useTranslation } from 'react-i18next';

export default function TestTranslation() {
  const { t } = useTranslation();
  
  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl">
      <h2 className="text-xl font-bold mb-4">{t('nav.create')}</h2>
      <p>{t('post.whatOnMind')}</p>
      <button className="btn-primary mt-2">{t('nav.createPost')}</button>
    </div>
  );
}