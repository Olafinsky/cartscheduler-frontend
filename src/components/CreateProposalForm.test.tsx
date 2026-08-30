import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CreateProposalForm from './CreateProposalForm';

const renderForm = (onSubmit = vi.fn().mockResolvedValue(undefined)) => {
    render(<CreateProposalForm firstHour={7} lastHour={17} participantId={42} scheduleDayId={8} onCancel={vi.fn()} onSubmit={onSubmit} />);
    return onSubmit;
};

afterEach(cleanup);

describe('CreateProposalForm', () => {
    it('wysyła jednogodzinną służbę z równymi godzinami API', async () => {
        const onSubmit = renderForm();
        await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }));
        expect(onSubmit).toHaveBeenCalledWith({ participantId: 42, scheduleDayId: 8, hourStart: 7, hourEnd: 7, serviceLengthStart: 1, serviceLengthEnd: 1 });
    });

    it('ogranicza godzinę DO do wartości późniejszych niż OD', async () => {
        renderForm();
        await userEvent.selectOptions(screen.getByLabelText('Służba od'), '14');
        const end = screen.getByLabelText('Służba do') as HTMLSelectElement;
        expect(end.value).toBe('15');
        expect(Array.from(end.options).map(option => option.value)).toEqual(['15', '16', '17', '18']);
    });

    it('udostępnia przerwę tylko gdy mieści się obok minimalnej służby', async () => {
        renderForm();
        expect(screen.queryByLabelText('Chcę przerwę')).not.toBeInTheDocument();
        await userEvent.selectOptions(screen.getByLabelText('Służba do'), '10');
        await userEvent.click(screen.getByLabelText('Chcę przerwę'));
        expect(screen.getByLabelText('Długość przerwy od')).toBeInTheDocument();
        expect(Array.from((screen.getByLabelText('Długość przerwy do') as HTMLSelectElement).options).map(o => o.value)).toEqual(['1', '2']);
        await userEvent.selectOptions(screen.getByLabelText('Długość służby od'), '3');
        expect(screen.queryByLabelText('Chcę przerwę')).not.toBeInTheDocument();
    });

    it('wysyła oba pola przerwy razem', async () => {
        const onSubmit = renderForm();
        await userEvent.selectOptions(screen.getByLabelText('Służba do'), '10');
        await userEvent.click(screen.getByLabelText('Chcę przerwę'));
        await userEvent.selectOptions(screen.getByLabelText('Długość przerwy do'), '2');
        await userEvent.click(screen.getByRole('button', { name: 'Dodaj' }));
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ hourEnd: 9, breakLengthStart: 1, breakLengthEnd: 2 }));
    });
});
