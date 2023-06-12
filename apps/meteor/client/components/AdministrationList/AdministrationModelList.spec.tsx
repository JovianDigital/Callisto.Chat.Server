import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';
import type { ReactNode } from 'react';
import React from 'react';

import ModalContextMock from '../../../tests/mocks/client/ModalContextMock';
import RouterContextMock from '../../../tests/mocks/client/RouterContextMock';
import type * as AdministrationModelListModule from './AdministrationModelList';

describe('AdministrationModelList', () => {
	const loadMock = (stubs?: Record<string, unknown>) => {
		return proxyquire.noCallThru().load<typeof AdministrationModelListModule>('./AdministrationModelList', {
			'../../../app/ui-utils/client': {},
			'../../lib/router': {},
			'../../views/hooks/useUpgradeTabParams': {
				useUpgradeTabParams: () => ({
					isLoading: false,
					tabType: 'Upgrade',
					trialEndDate: '2020-01-01',
				}),
			},
			'../../../lib/upgradeTab': {
				getUpgradeTabLabel: () => 'Upgrade',
				isFullyFeature: () => true,
			},
			'../../../app/authorization/client': {
				userHasAllPermission: () => true,
			},
			'@tanstack/react-query': {
				useQuery: () => '',
			},
			...stubs,
		}).default;
	};

	it('should render administration', async () => {
		const AdministrationModelList = loadMock();
		render(<AdministrationModelList accountBoxItems={[]} showWorkspace={true} onDismiss={() => null} />, { wrapper: ModalContextMock });

		expect(screen.getByText('Administration')).to.exist;
		expect(screen.getByText('Workspace')).to.exist;
		expect(screen.getByText('Upgrade')).to.exist;
	});

	it('should not render workspace', async () => {
		const AdministrationModelList = loadMock();
		render(<AdministrationModelList accountBoxItems={[]} showWorkspace={false} onDismiss={() => null} />, { wrapper: ModalContextMock });

		expect(screen.getByText('Administration')).to.exist;
		expect(screen.queryByText('Workspace')).to.not.exist;
		expect(screen.getByText('Upgrade')).to.exist;
	});

	context('when clicked', () => {
		const navigate = spy();
		const pushRoute = spy();
		const handleDismiss = spy();

		const ProvidersMock = ({ children }: { children: ReactNode }) => {
			return (
				<ModalContextMock>
					<RouterContextMock navigate={navigate} pushRoute={pushRoute}>
						{children}
					</RouterContextMock>
				</ModalContextMock>
			);
		};

		it('should go to admin index', async () => {
			const AdministrationModelList = loadMock();

			render(<AdministrationModelList accountBoxItems={[]} showWorkspace={true} onDismiss={handleDismiss} />, { wrapper: ProvidersMock });

			const button = screen.getByText('Workspace');

			userEvent.click(button);
			await waitFor(() => expect(navigate).to.have.been.called.with('/admin'));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should call upgrade route', async () => {
			const AdministrationModelList = loadMock();

			render(<AdministrationModelList accountBoxItems={[]} showWorkspace={false} onDismiss={handleDismiss} />, { wrapper: ProvidersMock });

			const button = screen.getByText('Upgrade');

			userEvent.click(button);

			await waitFor(() => expect(pushRoute).to.have.been.called.with('upgrade', { type: 'Upgrade' }, { trialEndDate: '2020-01-01' }));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should render admin box and call router', async () => {
			const handleDismiss = spy();
			const AdministrationModelList = loadMock();

			render(
				<AdministrationModelList
					accountBoxItems={[{ name: 'Admin Item', href: '/admin/item' } as any]}
					showWorkspace={false}
					onDismiss={handleDismiss}
				/>,
				{ wrapper: ProvidersMock },
			);

			const button = screen.getByText('Admin Item');

			userEvent.click(button);

			await waitFor(() => expect(navigate).to.have.been.called.with('/admin/item'));
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});

		it('should render admin box and call sidenav', async () => {
			const AdministrationModelList = loadMock();

			render(
				<AdministrationModelList
					accountBoxItems={[{ name: 'Admin Item', sideNav: 'admin' } as any]}
					showWorkspace={false}
					onDismiss={handleDismiss}
				/>,
				{ wrapper: ProvidersMock },
			);

			const button = screen.getByText('Admin Item');

			userEvent.click(button);
			await waitFor(() => expect(handleDismiss).to.have.been.called());
		});
	});
});
