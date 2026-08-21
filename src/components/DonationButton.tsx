
interface ChaiOption {
  name: string
  price: number
  description: string
}

const chaiOptions: ChaiOption[] = [
  { name: 'Special Chai', price: 49, description: 'Classic masala chai with our special blend' },
  { name: 'Doodh Patti Chai', price: 59, description: 'Rich and creamy milk tea' },
  { name: 'Adrak Elaichi Chai', price: 69, description: 'Ginger cardamom infused chai' },
  { name: 'Kesar Chai', price: 99, description: 'Premium saffron chai' },
]

interface DonationButtonProps {
  isOpen: boolean
  onClose: () => void
}

export default function DonationButton({ isOpen, onClose }: DonationButtonProps) {
  const handleChaiSelect = (chai: ChaiOption) => {
    // TODO: Integrate with Razorpay
    // For now, show alert with selected chai
    alert(`Selected: ${chai.name} - ₹${chai.price}\n\nRazorpay integration coming soon!`)
    onClose()
  }

  return (
    <>
      {/* Donation Modal */}
      {isOpen && (
        <div className="donation-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="donation-title">
          <div className="donation-modal" onClick={(e) => e.stopPropagation()}>
            <button className="donation-modal__close" onClick={onClose} aria-label="Close donation modal">
              ✕
            </button>
            <h2 id="donation-title" className="donation-modal__title">Chai on you :) ☕</h2>
            <p className="donation-modal__message">Pick your favorite chai to fuel our late-night coding sessions!</p>
            
            <div className="donation-modal__chai-list">
              {chaiOptions.map((chai, index) => (
                <button
                  key={index}
                  className="donation-modal__chai-item"
                  onClick={() => handleChaiSelect(chai)}
                >
                  <div className="donation-modal__chai-info">
                    <span className="donation-modal__chai-name">{chai.name}</span>
                    <span className="donation-modal__chai-desc">{chai.description}</span>
                  </div>
                  <span className="donation-modal__chai-price">₹{chai.price}</span>
                </button>
              ))}
            </div>
            
            <p className="donation-modal__note">No pressure — just vibes! 🎵</p>
          </div>
        </div>
      )}
    </>
  )
}
