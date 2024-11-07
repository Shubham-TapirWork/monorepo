import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import './Tabs.css';

function JustifiedExample() {
    const [radioValue, setRadioValue] = useState('1');

    const radios = [
        { name: 'DB', value: '1' },
        { name: 'YB', value: '2' },
        { name: 'REG', value: '3' },
    ];

    return (
        <div className='d-flex flex-column align-items-center justify-content-center mt-4'> 
            <ButtonGroup className='my-3 ms-5'> 
                {radios.map((radio, idx) => ( 
                    <ToggleButton 
                        key={idx} 
                        id={`radio-${idx}`} 
                        type="radio" 
                        variant="outline-success" 
                        name="radio" 
                        value={radio.value} 
                        checked={radioValue === radio.value} 
                        onChange={(e) => setRadioValue(e.currentTarget.value)} 
                        className={`${idx === 0 ? 'rounded-start' : ''} ${idx === radios.length - 1 ? 'rounded-end' : ''} ps-5 pe-5`} 
                    > 
                        {radio.name} 
                    </ToggleButton> 
                ))} 
            </ButtonGroup> 
             {/* <div className='mt-3  me-5'> 
                <Button variant="outline-primary" className="ps-5 pe-5 me-2 ms-5 rounded-pill">Restake Safe</Button> 
                <Button variant="outline-primary" className="ps-5 pe-5 me-2 rounded-pill">Restake with boost</Button> 
                <Button variant="outline-primary" className="ps-5 pe-5 rounded-pill">Restake only</Button> 
            </div>*/}
        </div>
    );
}

export default JustifiedExample;
