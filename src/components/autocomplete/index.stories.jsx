import AutoComplete from './index';
import currencies from '../../data/currencies.json'

const mappedCurrencies = currencies.map((c) => ({...c, label: c.name}))

export default {
  component: AutoComplete,
  title: 'Auto Complete',
  tags: ['autodocs']
}

export const Default = {
  args: {
    label: 'Sync Search',
    option: mappedCurrencies
  },
};

export const WithDescription = {
    args: {
      ...Default.args,
      description: 'Synchronous Search'
    },
  };

export const Disabled = {
  args: {
    ...Default.args,
    label: 'Disabled Search',
    disabled: true
  },
};

export const SearchOnFocus = {
  args: {
    ...Default.args,
    label: 'Search on Focus',
    searchOnFocus: true
  },
};

export const AsyncSearch = {
  args: {
    ...Default.args,
    label: 'Async Searchs',
    isAsync: true,
    onSearch: (keyword) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const nextOption = mappedCurrencies?.filter((x) => Object.values(x).some((v) => v.toLowerCase().includes(keyword)))
          resolve(nextOption)
        }, 3000)
      } )
    }
  },
};
