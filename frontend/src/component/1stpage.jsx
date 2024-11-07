import React, { useState } from 'react';
import Card from 'react-bootstrap/Card';
import CardGroup from 'react-bootstrap/CardGroup';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useNavigate } from 'react-router-dom';

function GroupExample() {
    const [selectedPercentage, setSelectedPercentage] = useState(0);
    const navigate = useNavigate();
  
    const handleButtonClick = (percentage) => {
      setSelectedPercentage(percentage);
      navigate('/content', { state: { selectedPercentage: percentage } }); // Pass selectedPercentage as state
    };

  return (
    <div className='mt-5' style={{ width: '80%', marginLeft: '10%' }}>
      <CardGroup>
        <Card style={{ background: 'linear-gradient(to left, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5))' }}>
          <Card.Img className='mt-5 mb-5' variant="top" src="/images/image.png" 
            style={{ width: '60%', marginLeft: '20%', borderRadius: '20px'}}/>
        </Card>
        <Card style={{ background: 'linear-gradient(to right, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5))' }}>
          <Card.Body>
            <Card.Title className='text-center'>Stake Safu with Tapir</Card.Title>
            <Container>
              <Row className='mt-5'>
                <Col>5%</Col>
                <Col><Button variant="dark" className='ps-3 pe-3' onClick={() => handleButtonClick(5)}>Stake</Button></Col>
                <Col>Restake Safe</Col>
              </Row>
              <Row>
                <Col>APR</Col>
                <Col>Some description</Col>
                <Col>Restaking + buying debeg protection</Col>
              </Row>
              <Row className='mt-5'>
                <Col>6%</Col>
                <Col><Button variant="dark" className='ps-3 pe-3' onClick={() => handleButtonClick(6)}>Stake</Button></Col>
                <Col>Restake only</Col>
              </Row>
              <Row>
                <Col>APR</Col>
                <Col>Some description</Col>
                <Col>Regular restaking</Col>
              </Row>
              <Row className='mt-5'>
                <Col>7%</Col>
                <Col><Button variant="dark" className='ps-3 pe-3' onClick={() => handleButtonClick(7)}>Stake</Button></Col>
                <Col>Restake with boost</Col>
              </Row>
              <Row>
                <Col>APR</Col>
                <Col>Some description</Col>
                <Col>Restaking + selling debeg protection</Col>
              </Row>
            </Container>
          </Card.Body>
        </Card>
      </CardGroup>
    </div>
  );
}

export default GroupExample;
