import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Download, Share2 } from 'lucide-react';

export const QRPopup = ({ isOpen, onClose, url }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Secure Transmission QR">
      <div className="flex flex-col items-center justify-center p-4 space-y-6">
        <div className="bg-white p-4 rounded-xl border-4 border-emerald-500/20">
           {/* Uses a public API for now. In production, use 'react-qr-code' package */}
           <img 
             src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`} 
             alt="QR Code" 
             className="w-48 h-48 mix-blend-multiply"
           />
        </div>
        
        <div className="text-center w-full">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Target Destination</p>
          <div className="bg-slate-950 border border-slate-800 rounded p-2 text-sm text-emerald-400 font-mono truncate w-full">
            {url}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
            <Button variant="secondary" onClick={() => window.open(url, '_blank')}>
                <Download className="w-4 h-4 mr-2" /> Save Image
            </Button>
            <Button onClick={() => navigator.clipboard.writeText(url)}>
                <Share2 className="w-4 h-4 mr-2" /> Copy URL
            </Button>
        </div>
      </div>
    </Modal>
  );
};