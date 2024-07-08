import React, { useState } from 'react';
import styled from 'styled-components';
import { Connection, PublicKey } from '@solana/web3.js';
import { WHITE, PURPLE, LIGHT_GRAY } from '../../constants';

import { hexToRGB } from '../../utils';
import Button from '../Button';

// =============================================================================
// Styled Components
// =============================================================================

const Group = styled.div`
    position: relative;
    display: flex;
`;

const Input = styled.input.attrs({
    placeholder: "Enter rpc-net URL"
  })`
    margin: 0;
    padding: 10px;
    width: 100%;
    color: ${hexToRGB(PURPLE, 0.99)};
    background-color: ${hexToRGB(PURPLE, 0.2)};
    font-size: 14px;
    border-radius: 6px;
    outline: none;
    border: none;
    height: 44px;
    @media (max-width: 400px) {
      width: 280px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    @media (max-width: 320px) {
      width: 220px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    ::placeholder {
      color: ${WHITE};
      background-color: ${hexToRGB(PURPLE, 0.5)};
    }
    ::selection {
      color: ${WHITE};
      background-color: ${hexToRGB(PURPLE, 0.5)};
    }
    ::-moz-selection {
      color: ${WHITE};
      background-color: ${hexToRGB(PURPLE, 0.5)};
    }
`;

const ButtonGroup = styled(Button)`
  width: 100px;
  margin-left: 10px;
`;

// =============================================================================
// Typedefs
// =============================================================================

interface Props {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    val?: string
}
  
// =============================================================================
// Main Component
// =============================================================================
const InputGroup = React.memo((props: Props) => {
    const {onChange, val} = props;
    const [event, setEvent] = useState<React.ChangeEvent<HTMLInputElement>>();
    return(
        <Group>
            <Input list="solana"  type="url" name='val$1' autoComplete='url' key={val} defaultValue={val} onChange={setEvent}/> 
            <datalist id="solana">
              <option value="https://api.devnet.solana.com/"/>
              <option value="https://api.testnet.solana.com/"/>
              <option value="https://api.mainnet-beta.solana.com/"/>
              <option value="https://rpc.testnet.fantom.network/"/>
            </datalist>
            <ButtonGroup onClick={_ => onChange(event)}>Set</ButtonGroup>
        </Group>
    );
})

export default InputGroup;
