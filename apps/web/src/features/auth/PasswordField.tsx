import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material'
import { forwardRef, useState } from 'react'

export const PasswordField = forwardRef<HTMLInputElement, TextFieldProps>(function PasswordField(
  props,
  ref,
) {
  const [show, setShow] = useState(false)

  return (
    <TextField
      {...props}
      inputRef={ref}
      type={show ? 'text' : 'password'}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={show ? 'Hide password' : 'Show password'}
                onClick={() => setShow((s) => !s)}
                edge="end"
                size="small"
                tabIndex={-1}
              >
                {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
})
