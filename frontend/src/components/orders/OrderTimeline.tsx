import React from 'react';
import { format } from 'date-fns';
import type { OrderTimeline as OrderTimelineEvent } from '../../store/orderStore';
import { useTranslation } from '../../i18n/useTranslation';

interface TimelineProps {
  timeline: OrderTimelineEvent[];
}

const statusColors: { [key: string]: string } = {
  PENDING: 'bg-gray-200 text-gray-800',
  PROCESSING: 'bg-blue-200 text-blue-800',
  CONFIRMED: 'bg-blue-200 text-blue-800',
  DELIVERED: 'bg-green-200 text-green-800',
  COMPLETED: 'bg-green-200 text-green-800',
  CANCELLED: 'bg-red-200 text-red-800',
};


/** Định dạng ngày an toàn: nếu timestamp thiếu/không hợp lệ thì trả chuỗi rỗng
 *  thay vì để date-fns ném lỗi làm sập cả trang. */
const formatTimestamp = (value?: string): string => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : format(date, 'MMM dd, yyyy • h:mm a');
};

/** OrderTimeline — Dòng thời gian trạng thái đơn (mỗi mốc kèm màu + thời điểm). */
export const OrderTimeline: React.FC<TimelineProps> = ({ timeline }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('order.timeline')}</h2>

      <div className="space-y-6">
        {timeline && timeline.length > 0 ? (
          timeline.map((event, index) => (
            <div key={index} className="flex gap-4">
              {/* Timeline marker */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border-2 border-current ${
                    statusColors[event.status] || 'bg-gray-300'
                  }`}
                />
                {index < timeline.length - 1 && <div className="w-1 h-12 bg-gray-300" />}
              </div>

              {/* Event content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusColors[event.status] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {t(`status.${event.status}`)}
                  </span>
                  {formatTimestamp(event.timestamp) && (
                    <span className="text-sm text-gray-600">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600">{t('order.noTimeline')}</p>
        )}
      </div>
    </div>
  );
};
