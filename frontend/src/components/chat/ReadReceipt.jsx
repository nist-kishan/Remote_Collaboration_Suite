import React from 'react';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { useReadReceipts } from '../hook/useChat';
import { useSelector } from 'react-redux';

const ReadReceipt = ({ chatId, messageId, senderId, className = '' }) => {
  const { user } = useSelector((state) => state.auth);
  const { data: receiptsData, isLoading } = useReadReceipts(chatId, messageId);
  
  if (isLoading || !receiptsData?.data) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Clock className="w-3 h-3 text-gray-400" />
      </div>
    );
  }

  const { readBy, deliveredTo } = receiptsData.data;
  const isOwnMessage = senderId === user?._id;
  
  if (!isOwnMessage) {
    return null; // Don't show read receipts for others' messages
  }

  const hasBeenRead = readBy && readBy.length > 0;
  const hasBeenDelivered = deliveredTo && deliveredTo.length > 0;

  const getReceiptIcon = () => {
    if (hasBeenRead) {
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    } else if (hasBeenDelivered) {
      return <CheckCheck className="w-3 h-3 text-gray-400" />;
    } else {
      return <Check className="w-3 h-3 text-gray-400" />;
    }
  };

  const getReceiptText = () => {
    if (hasBeenRead) {
      return `Read by ${readBy.length} user${readBy.length > 1 ? 's' : ''}`;
    } else if (hasBeenDelivered) {
      return `Delivered to ${deliveredTo.length} user${deliveredTo.length > 1 ? 's' : ''}`;
    } else {
      return 'Sent';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} title={getReceiptText()}>
      {getReceiptIcon()}
    </div>
  );
};

export default ReadReceipt;

