import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import useDebounce from './use-debounce';
import { usePopper } from 'react-popper';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

const modifiers = [
    {
        name: "sameWidth",
        enabled: true,
        fn: ({ state }) => {
            state.styles.popper.width = `${state.rects.reference.width}px`;
        },
        phase: "beforeWrite",
        requires: ["computeStyles"],
    },
    {
        name: 'offset',
        options: {
          offset: [0, 8],
        },
      },
]

export default function AutoComplete({ label, description, disabled, option, searchOnFocus, onSearch, isAsync }) {
    const [keyword, setKeyword]= useState('')
    const searchedKeyword = keyword.trim().toLowerCase()
    const [filteredOption, setFilteredOption] = useState([])
    const [selectedOption, setSelectedOption] = useState([]);
    const [highlightedOptionIndex, setHighlightedOptionIndex] = useState(null)
    const [showListBox, setShowListBox]= useState(false)
    const [isLoading, setIsLoading]= useState(false)

    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const { styles, attributes } = usePopper(referenceElement, popperElement, {
        placement: 'bottom-start',
        modifiers
    });

    useDebounce(async() => {
        if (!!onSearch && isAsync && searchedKeyword.length > 0) {
            setIsLoading(true)
            const nextOption = await onSearch(searchedKeyword)
            setFilteredOption(nextOption)
            setIsLoading(false)
            setHighlightedOptionIndex(null)
        }
    }, [searchedKeyword], 800);
        
    useEffect(() => {
        if (!isAsync) {
            setFilteredOption(option?.filter((x) => Object.values(x).some((v) => v.toLowerCase().includes(searchedKeyword))))
            setHighlightedOptionIndex(null)
        }
        setShowListBox(searchedKeyword.length > 0)
    }, [searchedKeyword])

    const handleSearch = (e) => setKeyword(e.target.value);
    const handleSelect = (isSelected, item) => {
        let nextSelected = selectedOption.filter((x) => x !== item)
        if (isSelected) {
            nextSelected = [...selectedOption, item]
        }
        setSelectedOption(nextSelected)
        referenceElement.focus()
        setShowListBox(true)
    }
    const handleKeydown = (e) => {
        if ([27, 9].includes(e.keyCode) && showListBox) {
            e.preventDefault();
            setShowListBox(false)
            return
        }
        if (e.keyCode === 13 && highlightedOptionIndex >= 0) {
            const fo = filteredOption[highlightedOptionIndex]
            const isSelected = selectedOption.includes(fo)
            handleSelect(!isSelected, fo)
            return
        }

        let nextIndex = highlightedOptionIndex ?? -1
        if (e.keyCode === 40) {
            nextIndex += 1
        } else if (e.keyCode === 38) {
            nextIndex -= 1
        }
        if (nextIndex === filteredOption?.length) {
            nextIndex = 0
        }
        if (nextIndex === -1) {
            nextIndex = filteredOption?.length - 1
        }
        setHighlightedOptionIndex(nextIndex)
        window.document.querySelectorAll('.nmrc-autocomplete__dropdown ul li')[nextIndex]?.scrollIntoViewIfNeeded()
    }

    useEffect(() => {
        const clickAway = function (e) {
            const container = window.document.querySelector('.nmrc-autocomplete')
            if (!container.contains(e.target)) {
                setShowListBox(false)
            }
        }

        window.document.addEventListener(
          "click",
          clickAway,
          false
        );

        return function cleanup() {
            window.document.removeEventListener("click", clickAway, false)
        };
    }, [])

    useEffect(() => {
        if (!showListBox) {
            setHighlightedOptionIndex(null)
        }
    }, [showListBox])


    return (
        <div className="nmrc-autocomplete">
            <div className='nmrc-autocomplete__content flex flex-col gap-1'>
                <label 
                    aria-label={label} 
                    className='nmrc-autocomplete__label text-sm text-black'
                >{label}</label>
                <div 
                    className='nmrc-autocomplete__input border rounded-lg flex gap-2 items-center p-2'
                    ref={setReferenceElement}>
                    <MagnifyingGlassIcon className='w-4 h-4 text-gray-500' />
                    <input 
                        type="text" 
                        disabled={disabled} 
                        className='!outline-none text-sm flex-1' 
                        value={keyword || ''}
                        onChange={handleSearch}
                        autoFocus
                        onFocus={() => setShowListBox(searchOnFocus)}
                        onKeyDown={handleKeydown}
                        />
                    <ArrowPathIcon className={`w-4 h-4 text-gray-500 animate-spin ${isLoading ? '' : 'hidden'}`} />
                </div>
                {description && 
                    <label 
                        aria-label={description} 
                        className='nmrc-autocomplete__description text-sm text-gray-500'
                    >{description}</label>}
            </div>
            {showListBox && (
                <div ref={setPopperElement} style={styles.popper} {...attributes.popper}>
                    <div className='nmrc-autocomplete__dropdown  w-full border rounded-lg bg-white overflow-hidden'>
                        <ul className='max-h-[200px] overflow-auto [&>*]:px-4 [&>*]:py-2 [&>*]:flex [&>*]:justify-between [&>*]:text-sm'>
                            {
                                filteredOption?.map((fo, i) => {
                                    const isChecked = selectedOption.includes(fo)
                                    const isHightlighed = highlightedOptionIndex === i
                                    return (
                                        <li 
                                            key={fo.value} 
                                            className={`cursor-pointer ${isHightlighed ? 'bg-cyan-500' : ''}`}
                                            onClick={() => handleSelect(!isChecked, fo)}
                                            onMouseEnter={() => setHighlightedOptionIndex(i)}>
                                            <div>{fo.label}</div>
                                            <div>
                                                <input 
                                                    type='checkbox'
                                                    checked={isChecked}
                                                    onChange={(e) => handleSelect(e.target.checked, fo)}
                                                    />
                                            </div>
                                        </li>
                                    )
                                })
                            }
                            {
                                filteredOption?.length === 0 && <li>No result were found</li>
                            }
                        </ul>
                    </div>
                </div>
            )}
            
        </div>
    );
}

AutoComplete.propTypes = {
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    disabled: PropTypes.bool,
    option: PropTypes.array,
    searchOnFocus: PropTypes.bool,
    isAsync: PropTypes.bool,
    onSearch: PropTypes.func
 };

AutoComplete.defaultProps = {
    option: [],
    disabled: false,
    searchOnFocus: false,
    isAsync: false
};