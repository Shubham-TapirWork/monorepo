import React, { useState } from 'react';
import { Card, InputGroup, Form, Button, Placeholder } from 'react-bootstrap';

function ButtonsExample() {
  const [amount, setAmount] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (!isNaN(value)) {
      setAmount(value);
      setCalculatedAmount(value * 1.05);
    }
  };

  return (
    <>
      <Card className="ms-5" style={{ width: '40%', borderRadius: 20 }}>
        <div style={{ width: '95%' }} className="m-3">
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Enter amount"
              aria-label="Enter amount"
              aria-describedby="basic-addon2"
              value={amount}
              onChange={handleInputChange}
            />
            <Button className="" variant="outline-primary" id="button-addon2">
              MAX
            </Button>
          </InputGroup>
          <Button className="p-2 mb-3" variant="primary" style={{ width: '100%', borderRadius: 15 }}>
            Connect Wallet
          </Button>
          <p aria-hidden="true">
            <Placeholder xs={12} style={{ height: '100px', borderRadius: 5 }} />
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span>You will receive</span>
            <span>5% APR</span>
          </div>
          <div style={{ marginTop: '10px' }}>
            <span>Calculated Amount: {calculatedAmount}</span>
          </div>
        </div>
      </Card>
    </>
  );
}

export default ButtonsExample;