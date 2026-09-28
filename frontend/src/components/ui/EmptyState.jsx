import { classNames } from '../../utils/credibility';
export default function EmptyState({ icon: Icon, title, text, action, className }) {
  return (
    <div className={classNames('empty-state', className)}>
      <div className="empty-icon">
        <Icon size={28} />
      </div>
      <h5>{title}</h5>
      <p>{text}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
